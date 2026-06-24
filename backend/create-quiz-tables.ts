import { getPool, testConnection } from './src/config/database';

async function createQuizTables() {
  try {
    await testConnection();
    const pool = await getPool();

    // 1. quizzes table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='quizzes' AND xtype='U')
      CREATE TABLE quizzes (
        id            INT           IDENTITY(1,1) PRIMARY KEY,
        title         NVARCHAR(255) NOT NULL,
        type          NVARCHAR(10)  NOT NULL CONSTRAINT chk_quiz_type CHECK (type IN ('mcq', 'document')),
        level         NVARCHAR(50)  NOT NULL,
        semester      NVARCHAR(50)  NOT NULL,
        edu_stream    NVARCHAR(50)  NOT NULL,
        time_limit    INT           NOT NULL DEFAULT 10,
        created_by    INT           NOT NULL,
        created_at    DATETIME2     NOT NULL DEFAULT GETDATE(),
        CONSTRAINT fk_quizzes_user FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
    console.log('✅ quizzes table created successfully!');

    // 2. quiz_questions table (MCQ only)
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='quiz_questions' AND xtype='U')
      CREATE TABLE quiz_questions (
        id            INT           IDENTITY(1,1) PRIMARY KEY,
        quiz_id       INT           NOT NULL,
        question_num  INT           NOT NULL,
        question_text NVARCHAR(MAX) NOT NULL,
        option_a      NVARCHAR(500) NOT NULL,
        option_b      NVARCHAR(500) NOT NULL,
        option_c      NVARCHAR(500) NOT NULL,
        option_d      NVARCHAR(500) NOT NULL,
        correct_option NVARCHAR(1)  NOT NULL CONSTRAINT chk_correct_opt CHECK (correct_option IN ('A', 'B', 'C', 'D')),
        CONSTRAINT fk_questions_quiz FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ quiz_questions table created successfully!');

    // 3. quiz_submissions table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='quiz_submissions' AND xtype='U')
      CREATE TABLE quiz_submissions (
        id            INT           IDENTITY(1,1) PRIMARY KEY,
        quiz_id       INT           NOT NULL,
        student_id    INT           NOT NULL,
        answers_json  NVARCHAR(MAX) NULL,
        score         INT           NULL,
        total         INT           NULL,
        file_path     NVARCHAR(500) NULL,
        original_name NVARCHAR(255) NULL,
        submitted_at  DATETIME2     NOT NULL DEFAULT GETDATE(),
        CONSTRAINT fk_submissions_quiz    FOREIGN KEY (quiz_id)    REFERENCES quizzes(id) ON DELETE CASCADE,
        CONSTRAINT fk_submissions_student FOREIGN KEY (student_id) REFERENCES users(id),
        CONSTRAINT uq_quiz_student UNIQUE (quiz_id, student_id)
      )
    `);
    console.log('✅ quiz_submissions table created successfully!');

    console.log('✅ All quiz tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating quiz tables:', error);
    process.exit(1);
  }
}

createQuizTables();
