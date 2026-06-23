// ============================================================
// src/controllers/auth.controller.ts
// Handles register, login, and get-current-user logic
// Adapted for Microsoft SQL Server (mssql package)
// ============================================================

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sql, getPool } from '../config/database';
import {
  RegisterRequest,
  LoginRequest,
  User,
  JwtPayload,
  UserResponse,
  ApiResponse,
  ForgotPasswordRequest,
  VerifyOtpRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
} from '../types';
import { AuthRequest } from '../middleware/auth.middleware';

// ----------------------------------------------------------
// Key differences from MySQL (mysql2):
//
//  mysql2:  pool.execute('SELECT ? WHERE id = ?', [val])
//  mssql:   pool.request()
//              .input('paramName', sql.NVarChar, value)
//              .query('SELECT @paramName WHERE id = @id')
//
//  mysql2:  result[0] is the rows array
//  mssql:   result.recordset is the rows array
//
//  mysql2:  (result as { insertId: number }).insertId
//  mssql:   Use OUTPUT INSERTED.id in the INSERT statement,
//           then read result.recordset[0].id
// ----------------------------------------------------------

// ----------------------------------------------------------
// Helper: generate a JWT for a user
// ----------------------------------------------------------
const generateToken = (payload: JwtPayload): string => {
  const secret = process.env.JWT_SECRET as string;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
};

// ----------------------------------------------------------
// POST /api/auth/register
// Register a new student account
// ----------------------------------------------------------
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { full_name, email, student_id, mobile_number, password }: RegisterRequest = req.body;

    // --- Basic validation ---
    if (!full_name || !email || !student_id || !mobile_number || !password) {
      res.status(400).json(<ApiResponse>{
        success: false,
        message: 'All fields are required: full_name, email, student_id, mobile_number, password.',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json(<ApiResponse>{
        success: false,
        message: 'Password must be at least 6 characters.',
      });
      return;
    }

    // --- Check for duplicate email or student_id ---
    // mssql: use .input() for each parameter, then @paramName in the query
    const pool = await getPool();
    const duplicateCheck = await pool.request()
      .input('email', sql.NVarChar(150), email)
      .input('student_id', sql.NVarChar(50), student_id)
      .input('mobile_number', sql.NVarChar(20), mobile_number)
      .query('SELECT id FROM users WHERE email = @email OR student_id = @student_id OR mobile_number = @mobile_number');

    if (duplicateCheck.recordset.length > 0) {
      res.status(409).json(<ApiResponse>{
        success: false,
        message: 'An account with this email, student ID, or mobile number already exists.',
      });
      return;
    }

    // --- Hash password ---
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // --- Insert new user ---
    // OUTPUT INSERTED.id lets us get the auto-generated IDENTITY value back
    const insertResult = await pool.request()
      .input('full_name',     sql.NVarChar(100), full_name)
      .input('email',         sql.NVarChar(150), email)
      .input('student_id',    sql.NVarChar(50),  student_id)
      .input('mobile_number', sql.NVarChar(20),  mobile_number)
      .input('password_hash', sql.NVarChar(255), password_hash)
      .query(`
        INSERT INTO users (full_name, email, student_id, mobile_number, password_hash, role)
        OUTPUT INSERTED.id
        VALUES (@full_name, @email, @student_id, @mobile_number, @password_hash, 'student')
      `);

    const newUserId: number = insertResult.recordset[0].id;

    // --- Generate JWT ---
    const token = generateToken({ userId: newUserId, email, role: 'student' });

    res.status(201).json(<ApiResponse<{ token: string; user: UserResponse }>>{
      success: true,
      message: 'Registration successful.',
      data: {
        token,
        user: {
          id: newUserId,
          full_name,
          email,
          student_id,
          mobile_number,
          role: 'student',
          created_at: new Date(),
        },
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json(<ApiResponse>{ success: false, message: 'Internal server error.' });
  }
};

// ----------------------------------------------------------
// POST /api/auth/login
// Login for both students and admins
// ----------------------------------------------------------
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginRequest = req.body;

    // --- Basic validation ---
    if (!email || !password) {
      res.status(400).json(<ApiResponse>{
        success: false,
        message: 'Email and password are required.',
      });
      return;
    }

    // --- Find user by email ---
    const pool = await getPool();
    const userResult = await pool.request()
      .input('email', sql.NVarChar(150), email)
      .query('SELECT * FROM users WHERE email = @email');

    const users = userResult.recordset as User[];
    if (users.length === 0) {
      res.status(401).json(<ApiResponse>{ success: false, message: 'Invalid email or password.' });
      return;
    }

    const user = users[0];

    // --- Verify password ---
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      res.status(401).json(<ApiResponse>{ success: false, message: 'Invalid email or password.' });
      return;
    }

    // --- Generate JWT ---
    const token = generateToken({ userId: user.id, email: user.email, role: user.role });

    const userResponse: UserResponse = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      student_id: user.student_id,
      mobile_number: user.mobile_number,
      role: user.role,
      created_at: user.created_at,
    };

    res.status(200).json(<ApiResponse<{ token: string; user: UserResponse }>>{
      success: true,
      message: 'Login successful.',
      data: { token, user: userResponse },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(<ApiResponse>{ success: false, message: 'Internal server error.' });
  }
};

// ----------------------------------------------------------
// GET /api/auth/me
// Returns the currently logged-in user's profile
// ----------------------------------------------------------
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (userId === undefined) {
      res.status(401).json(<ApiResponse>{ success: false, message: 'Not authenticated.' });
      return;
    }

    const pool = await getPool();
    const userResult = await pool.request()
      .input('id', sql.Int, userId)
      .query('SELECT id, full_name, email, student_id, mobile_number, role, created_at FROM users WHERE id = @id');

    const users = userResult.recordset as UserResponse[];
    if (users.length === 0) {
      res.status(404).json(<ApiResponse>{ success: false, message: 'User not found.' });
      return;
    }

    res.status(200).json(<ApiResponse<UserResponse>>{
      success: true,
      message: 'User profile retrieved.',
      data: users[0],
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json(<ApiResponse>{ success: false, message: 'Internal server error.' });
  }
};

// ----------------------------------------------------------
// PUT /api/auth/profile
// Update the currently logged-in user's profile
// ----------------------------------------------------------
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (userId === undefined) {
      res.status(401).json(<ApiResponse>{ success: false, message: 'Not authenticated.' });
      return;
    }

    const { full_name, email, mobile_number, student_id }: UpdateProfileRequest = req.body;

    // --- Basic validation ---
    if (!full_name || !email) {
      res.status(400).json(<ApiResponse>{
        success: false,
        message: 'Full name and email are required.',
      });
      return;
    }

    const pool = await getPool();

    // --- Check for duplicate email, student_id, mobile_number (exclude current user) ---
    const duplicateCheck = await pool.request()
      .input('email', sql.NVarChar(150), email)
      .input('student_id', sql.NVarChar(50), student_id || '')
      .input('mobile_number', sql.NVarChar(20), mobile_number || '')
      .input('id', sql.Int, userId)
      .query(`
        SELECT id FROM users
        WHERE id != @id
          AND (email = @email
               OR (student_id = @student_id AND @student_id != '')
               OR (mobile_number = @mobile_number AND @mobile_number != ''))
      `);

    if (duplicateCheck.recordset.length > 0) {
      res.status(409).json(<ApiResponse>{
        success: false,
        message: 'Another account with this email, student ID, or mobile number already exists.',
      });
      return;
    }

    // --- Update the user ---
    await pool.request()
      .input('full_name', sql.NVarChar(100), full_name)
      .input('email', sql.NVarChar(150), email)
      .input('mobile_number', sql.NVarChar(20), mobile_number || '')
      .input('student_id', sql.NVarChar(50), student_id || '')
      .input('id', sql.Int, userId)
      .query(`
        UPDATE users
        SET full_name = @full_name,
            email = @email,
            mobile_number = @mobile_number,
            student_id = @student_id
        WHERE id = @id
      `);

    // --- Fetch updated user to return ---
    const updatedResult = await pool.request()
      .input('uid', sql.Int, userId)
      .query('SELECT id, full_name, email, student_id, mobile_number, role, created_at FROM users WHERE id = @uid');

    const updatedUser = updatedResult.recordset[0] as UserResponse;

    res.status(200).json(<ApiResponse<UserResponse>>{
      success: true,
      message: 'Profile updated successfully.',
      data: updatedUser,
    });
  } catch (error) {
    console.error('UpdateProfile error:', error);
    res.status(500).json(<ApiResponse>{ success: false, message: 'Internal server error.' });
  }
};

// ----------------------------------------------------------
// POST /api/auth/forgot-password
// ----------------------------------------------------------
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email }: ForgotPasswordRequest = req.body;

    if (!email) {
      res.status(400).json(<ApiResponse>{ success: false, message: 'Email address is required.' });
      return;
    }

    const pool = await getPool();
    const userResult = await pool.request()
      .input('email', sql.NVarChar(150), email)
      .query('SELECT id FROM users WHERE email = @email');

    if (userResult.recordset.length === 0) {
      res.status(404).json(<ApiResponse>{ success: false, message: 'User with this email not found.' });
      return;
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await pool.request()
      .input('otp_code', sql.NVarChar(10), otp)
      .input('otp_expiry', sql.DateTime2, expiry)
      .input('email', sql.NVarChar(150), email)
      .query('UPDATE users SET otp_code = @otp_code, otp_expiry = @otp_expiry WHERE email = @email');

    // MOCK EMAIL: Log OTP to console
    console.log(`\n========================================`);
    console.log(`📧 MOCK EMAIL SENT TO ${email}`);
    console.log(`🔑 Your UNISpace reset OTP is: ${otp}`);
    console.log(`========================================\n`);

    res.status(200).json(<ApiResponse>{ success: true, message: 'OTP sent successfully to your email address.' });
  } catch (error) {
    console.error('Forgot Password error:', error);
    res.status(500).json(<ApiResponse>{ success: false, message: 'Internal server error.' });
  }
};

// ----------------------------------------------------------
// POST /api/auth/verify-otp
// ----------------------------------------------------------
export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp }: VerifyOtpRequest = req.body;

    if (!email || !otp) {
      res.status(400).json(<ApiResponse>{ success: false, message: 'Email and OTP are required.' });
      return;
    }

    const pool = await getPool();
    const userResult = await pool.request()
      .input('email', sql.NVarChar(150), email)
      .query('SELECT id, otp_code, otp_expiry FROM users WHERE email = @email');

    if (userResult.recordset.length === 0) {
      res.status(404).json(<ApiResponse>{ success: false, message: 'User not found.' });
      return;
    }

    const user = userResult.recordset[0];

    if (user.otp_code !== otp) {
      res.status(400).json(<ApiResponse>{ success: false, message: 'Invalid OTP.' });
      return;
    }

    if (new Date(user.otp_expiry) < new Date()) {
      res.status(400).json(<ApiResponse>{ success: false, message: 'OTP has expired.' });
      return;
    }

    res.status(200).json(<ApiResponse>{ success: true, message: 'OTP verified successfully.' });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json(<ApiResponse>{ success: false, message: 'Internal server error.' });
  }
};

// ----------------------------------------------------------
// POST /api/auth/reset-password
// ----------------------------------------------------------
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp, new_password }: ResetPasswordRequest = req.body;

    if (!email || !otp || !new_password) {
      res.status(400).json(<ApiResponse>{ success: false, message: 'Email, OTP, and new password are required.' });
      return;
    }

    if (new_password.length < 6) {
      res.status(400).json(<ApiResponse>{ success: false, message: 'Password must be at least 6 characters.' });
      return;
    }

    const pool = await getPool();
    const userResult = await pool.request()
      .input('email', sql.NVarChar(150), email)
      .query('SELECT id, otp_code, otp_expiry FROM users WHERE email = @email');

    if (userResult.recordset.length === 0) {
      res.status(404).json(<ApiResponse>{ success: false, message: 'User not found.' });
      return;
    }

    const user = userResult.recordset[0];

    if (user.otp_code !== otp) {
      res.status(400).json(<ApiResponse>{ success: false, message: 'Invalid OTP.' });
      return;
    }

    if (new Date(user.otp_expiry) < new Date()) {
      res.status(400).json(<ApiResponse>{ success: false, message: 'OTP has expired.' });
      return;
    }

    // Hash new password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(new_password, saltRounds);

    await pool.request()
      .input('password_hash', sql.NVarChar(255), password_hash)
      .input('id', sql.Int, user.id)
      .query('UPDATE users SET password_hash = @password_hash, otp_code = NULL, otp_expiry = NULL WHERE id = @id');

    res.status(200).json(<ApiResponse>{ success: true, message: 'Password reset successfully. You can now login.' });
  } catch (error) {
    console.error('Reset Password error:', error);
    res.status(500).json(<ApiResponse>{ success: false, message: 'Internal server error.' });
  }
};
