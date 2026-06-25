import { getPool, testConnection } from './src/config/database';

async function createSessionsTables() {
  try {
    await testConnection();
    const pool = await getPool();

    // 1. sessions table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='sessions' AND xtype='U')
      CREATE TABLE sessions (
        id               INT           IDENTITY(1,1) PRIMARY KEY,
        title            NVARCHAR(255) NOT NULL,
        description      NVARCHAR(MAX) NULL,
        host_id          INT           NOT NULL,
        scheduled_at     DATETIME2     NOT NULL,
        max_participants INT           NOT NULL DEFAULT 10,
        jitsi_room_name  NVARCHAR(255) NOT NULL,
        status           NVARCHAR(20)  NOT NULL DEFAULT 'scheduled'
                           CONSTRAINT chk_session_status CHECK (status IN ('scheduled', 'active', 'ended')),
        created_at       DATETIME2     NOT NULL DEFAULT GETDATE(),
        updated_at       DATETIME2     NOT NULL DEFAULT GETDATE(),
        CONSTRAINT fk_sessions_host FOREIGN KEY (host_id) REFERENCES users(id)
      )
    `);
    console.log('✅ sessions table created successfully!');

    // 2. session_participants table (join table)
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='session_participants' AND xtype='U')
      CREATE TABLE session_participants (
        id         INT       IDENTITY(1,1) PRIMARY KEY,
        session_id INT       NOT NULL,
        user_id    INT       NOT NULL,
        joined_at  DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT fk_sp_session FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
        CONSTRAINT fk_sp_user    FOREIGN KEY (user_id)    REFERENCES users(id),
        CONSTRAINT uq_session_user UNIQUE (session_id, user_id)
      )
    `);
    console.log('✅ session_participants table created successfully!');

    console.log('✅ All session tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating session tables:', error);
    process.exit(1);
  }
}

createSessionsTables();
