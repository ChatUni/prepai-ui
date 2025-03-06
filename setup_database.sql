-- Use the database
USE prepai_courses;

-- Create instructors table if it doesn't exist
CREATE TABLE IF NOT EXISTS instructors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image VARCHAR(255)
);

-- Add video_url column to courses table if it doesn't exist
SELECT COUNT(*) INTO @columnExists FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'courses' AND COLUMN_NAME = 'video_url';

SET @query = IF(@columnExists = 0,
                'ALTER TABLE courses ADD COLUMN video_url VARCHAR(255)',
                'SELECT "video_url column already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check if courses table exists
SELECT COUNT(*) INTO @tableExists 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'prepai_courses' AND TABLE_NAME = 'courses';

-- Display a message about the courses table
SELECT IF(@tableExists = 0,
    'WARNING: courses table does not exist. Please create the courses table first.',
    'courses table exists, continuing with setup.') AS message;

-- Add instructor_id column to courses table if it doesn't exist and the courses table exists
SELECT COUNT(*) INTO @columnExists FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'courses' AND COLUMN_NAME = 'instructor_id' AND @tableExists > 0;

SET @query = IF(@columnExists = 0 AND @tableExists > 0,
                'ALTER TABLE courses ADD COLUMN instructor_id INT',
                'SELECT "instructor_id column already exists or courses table does not exist"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Insert instructors if they don't exist
INSERT INTO instructors (id, name, description, image)
SELECT 1, '陈浩老师', '知名数学讲师，擅长高数、线性代数、概率论与数理统计等课程。', 'https://via.placeholder.com/150x150/F06292/FFFFFF?text=陈浩老师'
WHERE NOT EXISTS (SELECT 1 FROM instructors WHERE id = 1);

INSERT INTO instructors (id, name, description, image)
SELECT 2, '子森', '资深物理学讲师，专注于量子力学及其相关领域的研究和教学。', 'https://via.placeholder.com/150x150/3B82F6/FFFFFF?text=子森'
WHERE NOT EXISTS (SELECT 1 FROM instructors WHERE id = 2);

-- Check if the instructor column exists in courses table
SELECT COUNT(*) INTO @hasInstructorColumn 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'courses' AND COLUMN_NAME = 'instructor' AND @tableExists > 0;

-- Update instructor_id in courses table based on instructor name if both columns exist
SET @query = IF(@hasInstructorColumn > 0 AND @columnExists > 0,
                'UPDATE courses SET instructor_id = 1 WHERE instructor = "陈浩老师"',
                'SELECT "Cannot update instructor_id: missing columns or courses table"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @query = IF(@hasInstructorColumn > 0 AND @columnExists > 0,
                'UPDATE courses SET instructor_id = 2 WHERE instructor = "子森"',
                'SELECT "Cannot update instructor_id: missing columns or courses table"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verify instructors
SELECT * FROM instructors;

-- Verify courses structure if courses table exists
SET @query = IF(@tableExists > 0,
                'DESCRIBE courses',
                'SELECT "courses table does not exist"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;