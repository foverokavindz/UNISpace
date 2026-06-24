-- ============================================================
-- database/schema.sql
-- UNISpace database schema — Microsoft SQL Server
-- Run in SSMS: File > Open > Run, or via sqlcmd:
--   sqlcmd -S localhost -U sa -P your_password -i schema.sql
-- ============================================================

-- Create database if it doesn't exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'unispace_db')
BEGIN
    CREATE DATABASE unispace_db;
END
GO

USE unispace_db;
GO

-- ============================================================
-- Table: users
-- Stores all users (students and admins)
-- ============================================================
-- MSSQL differences from MySQL:
--   INT AUTO_INCREMENT  →  INT IDENTITY(1,1)
--   ENUM(...)           →  NVARCHAR(10) + CHECK constraint
--   TIMESTAMP           →  DATETIME2
--   DEFAULT NOW()       →  DEFAULT GETDATE()
--   VARCHAR             →  NVARCHAR  (supports Unicode)
-- ============================================================
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_NAME = 'users' AND TABLE_CATALOG = 'unispace_db'
)
BEGIN
    CREATE TABLE users (
        id            INT           IDENTITY(1,1) PRIMARY KEY,
        full_name     NVARCHAR(100) NOT NULL,
        email         NVARCHAR(150) NOT NULL UNIQUE,
        student_id    NVARCHAR(50)  NOT NULL UNIQUE,
        password_hash NVARCHAR(255) NOT NULL,
        mobile_number NVARCHAR(20)  NULL,
        otp_code      NVARCHAR(10)  NULL,
        otp_expiry    DATETIME2     NULL,
        role          NVARCHAR(10)  NOT NULL DEFAULT 'student'
                        CONSTRAINT chk_role CHECK (role IN ('student', 'admin')),
        created_at    DATETIME2     NOT NULL DEFAULT GETDATE()
    );
END
GO

-- ============================================================
-- Table: roles  (reference table for future use)
-- ============================================================
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_NAME = 'roles' AND TABLE_CATALOG = 'unispace_db'
)
BEGIN
    CREATE TABLE roles (
        id          INT           IDENTITY(1,1) PRIMARY KEY,
        role_name   NVARCHAR(50)  NOT NULL UNIQUE,
        description NVARCHAR(255)
    );
END
GO

-- ============================================================
-- Seed: Insert default roles (MSSQL uses MERGE instead of INSERT IGNORE)
-- ============================================================
MERGE INTO roles AS target
USING (VALUES ('student', 'Regular university student'),
              ('admin',   'System administrator with full access')) AS src(role_name, description)
ON target.role_name = src.role_name
WHEN NOT MATCHED THEN
    INSERT (role_name, description) VALUES (src.role_name, src.description);
GO

-- ============================================================
-- Seed: Insert a default admin account
-- Password: "password"  (bcrypt hash, 10 rounds)
-- Change this after first login!
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@unispace.com')
BEGIN
    INSERT INTO users (full_name, email, student_id, password_hash, mobile_number, role)
    VALUES (
        'Admin User',
        'admin@unispace.com',
        'ADMIN-001',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        '0000000000',
        'admin'
    );
END
GO

-- ============================================================
-- Table: notifications
-- Stores notifications for users
-- ============================================================
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_NAME = 'notifications' AND TABLE_CATALOG = 'unispace_db'
)
BEGIN
    CREATE TABLE notifications (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        message NVARCHAR(500) NOT NULL,
        resource_path NVARCHAR(500) NULL,
        is_read BIT DEFAULT 0,
        created_at DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
END
GO
-- ============================================================
-- Table: resources
-- Stores academic resources (notes, slides, past papers, etc.)
-- ============================================================
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
);
GO

-- ============================================================
-- Table: quizzes
-- Stores details of quizzes (MCQ or Document-based)
-- ============================================================
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
);
GO

-- ============================================================
-- Table: quiz_questions
-- Stores questions for MCQ quizzes
-- ============================================================
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
);
GO

-- ============================================================
-- Table: quiz_submissions
-- Stores quiz submission files or MCQ scores for students
-- ============================================================
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
);
GO
