import { getPool, testConnection } from './src/config/database';

async function createTable() {
  try {
    await testConnection();
    const pool = await getPool();
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='resources' AND xtype='U')
      CREATE TABLE resources (
        id INT IDENTITY(1,1) PRIMARY KEY,
        title NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX),
        file_path NVARCHAR(500) NOT NULL,
        original_name NVARCHAR(255) NOT NULL,
        mime_type NVARCHAR(100),
        level NVARCHAR(50),
        semester NVARCHAR(50),
        subject NVARCHAR(50),
        category NVARCHAR(50),
        created_at DATETIME2 DEFAULT GETDATE()
      )
    `);
    console.log('✅ Resources table created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating table:', error);
    process.exit(1);
  }
}

createTable();
