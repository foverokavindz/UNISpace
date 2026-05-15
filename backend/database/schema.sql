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
