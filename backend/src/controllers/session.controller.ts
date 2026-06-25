// ============================================================
// src/controllers/session.controller.ts
// Controller for live study sessions (Jitsi meetings)
// ============================================================

import { Response } from 'express';
import crypto from 'crypto';
import { sql, getPool } from '../config/database';
import { ApiResponse, CreateSessionRequest } from '../types';
import { AuthRequest } from '../middleware/auth.middleware';

// ----------------------------------------------------------
// POST /api/sessions — Create a study session
// ----------------------------------------------------------
export const createSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, scheduled_at, max_participants }: CreateSessionRequest = req.body;
    const userId = req.user!.userId;

    if (!title || !scheduled_at) {
      res.status(400).json(<ApiResponse>{ success: false, message: 'Missing required fields: title, scheduled_at.' });
      return;
    }

    const scheduledDate = new Date(scheduled_at);
    if (isNaN(scheduledDate.getTime())) {
      res.status(400).json(<ApiResponse>{ success: false, message: 'Invalid scheduled_at date.' });
      return;
    }

    const maxVal = max_participants && max_participants > 1 ? max_participants : 10;
    const jitsiRoomName = 'unispace-' + crypto.randomUUID();

    const pool = await getPool();

    const result = await pool.request()
      .input('title', sql.NVarChar(255), title)
      .input('description', sql.NVarChar(sql.MAX), description ?? null)
      .input('host_id', sql.Int, userId)
      .input('scheduled_at', sql.DateTime2, scheduledDate)
      .input('max_participants', sql.Int, maxVal)
      .input('jitsi_room_name', sql.NVarChar(255), jitsiRoomName)
      .query(`
        INSERT INTO sessions (title, description, host_id, scheduled_at, max_participants, jitsi_room_name)
        OUTPUT INSERTED.id, INSERTED.jitsi_room_name
        VALUES (@title, @description, @host_id, @scheduled_at, @max_participants, @jitsi_room_name)
      `);

    const inserted = result.recordset[0];

    res.status(201).json(<ApiResponse<any>>{
      success: true,
      message: 'Session created successfully.',
      data: { id: inserted.id, jitsi_room_name: inserted.jitsi_room_name }
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json(<ApiResponse>{ success: false, message: 'Internal server error.' });
  }
};

// ----------------------------------------------------------
// GET /api/sessions — List upcoming / active sessions
// ----------------------------------------------------------
export const getSessions = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pool = await getPool();

    const result = await pool.request().query(`
      SELECT
        s.id, s.title, s.description, s.host_id, s.scheduled_at,
        s.max_participants, s.jitsi_room_name, s.status, s.created_at, s.updated_at,
        u.full_name AS host_name,
        (SELECT COUNT(*) FROM session_participants sp WHERE sp.session_id = s.id) AS participant_count
      FROM sessions s
      LEFT JOIN users u ON u.id = s.host_id
      WHERE s.status <> 'ended'
      ORDER BY s.scheduled_at ASC
    `);

    res.status(200).json(<ApiResponse<any>>{
      success: true,
      message: 'Sessions retrieved.',
      data: result.recordset
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json(<ApiResponse>{ success: false, message: 'Internal server error.' });
  }
};

// ----------------------------------------------------------
// GET /api/sessions/:id — Single session with participants
// ----------------------------------------------------------
export const getSessionById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json(<ApiResponse>{ success: false, message: 'Invalid session id.' });
      return;
    }

    const pool = await getPool();

    const sessionResult = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT
          s.id, s.title, s.description, s.host_id, s.scheduled_at,
          s.max_participants, s.jitsi_room_name, s.status, s.created_at, s.updated_at,
          u.full_name AS host_name
        FROM sessions s
        LEFT JOIN users u ON u.id = s.host_id
        WHERE s.id = @id
      `);

    if (sessionResult.recordset.length === 0) {
      res.status(404).json(<ApiResponse>{ success: false, message: 'Session not found.' });
      return;
    }

    const participantsResult = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT sp.id, sp.session_id, sp.user_id, sp.joined_at, u.full_name AS user_name
        FROM session_participants sp
        LEFT JOIN users u ON u.id = sp.user_id
        WHERE sp.session_id = @id
        ORDER BY sp.joined_at ASC
      `);

    const session = sessionResult.recordset[0];
    session.participant_count = participantsResult.recordset.length;

    res.status(200).json(<ApiResponse<any>>{
      success: true,
      message: 'Session retrieved.',
      data: { ...session, participants: participantsResult.recordset }
    });
  } catch (error) {
    console.error('Get session by id error:', error);
    res.status(500).json(<ApiResponse>{ success: false, message: 'Internal server error.' });
  }
};

// ----------------------------------------------------------
// POST /api/sessions/:id/join — Join a session
// ----------------------------------------------------------
export const joinSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = req.user!.userId;
    if (isNaN(id)) {
      res.status(400).json(<ApiResponse>{ success: false, message: 'Invalid session id.' });
      return;
    }

    const pool = await getPool();

    // Load session + current participant count
    const sessionResult = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT s.status, s.max_participants,
          (SELECT COUNT(*) FROM session_participants sp WHERE sp.session_id = s.id) AS participant_count
        FROM sessions s WHERE s.id = @id
      `);

    if (sessionResult.recordset.length === 0) {
      res.status(404).json(<ApiResponse>{ success: false, message: 'Session not found.' });
      return;
    }

    const session = sessionResult.recordset[0];

    if (session.status === 'ended') {
      res.status(400).json(<ApiResponse>{ success: false, message: 'This session has ended.' });
      return;
    }

    // Already joined? — idempotent success
    const existing = await pool.request()
      .input('session_id', sql.Int, id)
      .input('user_id', sql.Int, userId)
      .query('SELECT id FROM session_participants WHERE session_id = @session_id AND user_id = @user_id');

    if (existing.recordset.length > 0) {
      res.status(200).json(<ApiResponse>{ success: true, message: 'Already joined.' });
      return;
    }

    if (session.participant_count >= session.max_participants) {
      res.status(400).json(<ApiResponse>{ success: false, message: 'Session is full.' });
      return;
    }

    await pool.request()
      .input('session_id', sql.Int, id)
      .input('user_id', sql.Int, userId)
      .query('INSERT INTO session_participants (session_id, user_id) VALUES (@session_id, @user_id)');

    res.status(201).json(<ApiResponse>{ success: true, message: 'Joined session.' });
  } catch (error) {
    console.error('Join session error:', error);
    res.status(500).json(<ApiResponse>{ success: false, message: 'Internal server error.' });
  }
};

// ----------------------------------------------------------
// DELETE /api/sessions/:id — Host cancels their session
// ----------------------------------------------------------
export const deleteSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const userId = req.user!.userId;
    if (isNaN(id)) {
      res.status(400).json(<ApiResponse>{ success: false, message: 'Invalid session id.' });
      return;
    }

    const pool = await getPool();

    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('host_id', sql.Int, userId)
      .query('DELETE FROM sessions WHERE id = @id AND host_id = @host_id');

    if (result.rowsAffected[0] === 0) {
      res.status(403).json(<ApiResponse>{ success: false, message: 'Session not found or you are not the host.' });
      return;
    }

    res.status(200).json(<ApiResponse>{ success: true, message: 'Session cancelled.' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json(<ApiResponse>{ success: false, message: 'Internal server error.' });
  }
};
