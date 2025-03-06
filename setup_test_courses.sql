-- Create and use the database
CREATE DATABASE IF NOT EXISTS prepai_courses;
USE prepai_courses;

-- Create instructors table
CREATE TABLE IF NOT EXISTS instructors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image VARCHAR(255)
);

-- Create courses table with basic structure
CREATE TABLE IF NOT EXISTS courses (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  instructor VARCHAR(100) NOT NULL,
  image VARCHAR(255) NOT NULL,
  viewCount INT NOT NULL DEFAULT 0,
  category VARCHAR(50) NOT NULL,
  keywords VARCHAR(255),
  duration VARCHAR(50) DEFAULT '00:00',
  recommended BOOLEAN DEFAULT FALSE,
  video_url VARCHAR(255)
);

-- Clear existing data for clean test setup
TRUNCATE TABLE instructors;
TRUNCATE TABLE courses;

-- Insert instructors
INSERT INTO instructors (id, name, description, image) VALUES
(1, '陈浩老师', '知名数学讲师，擅长高数、线性代数、概率论与数理统计等课程。', 'https://via.placeholder.com/150x150/F06292/FFFFFF?text=陈浩老师'),
(2, '子森', '资深物理学讲师，专注于量子力学及其相关领域的研究和教学。', 'https://via.placeholder.com/150x150/3B82F6/FFFFFF?text=子森');

-- Insert sample courses for testing
INSERT INTO courses (id, title, instructor, image, viewCount, category, keywords, duration, recommended) VALUES
(1, 'Introduction to Calculus', '陈浩老师', 'https://via.placeholder.com/300x200/F59E0B/FFFFFF?text=Calculus', 1250, '私教', 'math,calculus,introduction', '45:30', TRUE),
(2, 'Linear Algebra Fundamentals', '陈浩老师', 'https://via.placeholder.com/300x200/F59E0B/FFFFFF?text=Algebra', 980, '私教', 'math,algebra,linear', '38:15', FALSE),
(3, 'Probability Theory', '陈浩老师', 'https://via.placeholder.com/300x200/F59E0B/FFFFFF?text=Probability', 1500, '私教', 'math,probability,statistics', '52:20', TRUE),
(4, 'Advanced Calculus', '陈浩老师', 'https://via.placeholder.com/300x200/F59E0B/FFFFFF?text=Advanced', 850, '私教', 'math,calculus,advanced', '48:45', FALSE),
(5, 'Quantum Mechanics Basics', '子森', 'https://via.placeholder.com/300x200/3B82F6/FFFFFF?text=Quantum', 2200, '私教', 'physics,quantum,basics', '65:10', TRUE),
(6, 'Quantum Field Theory', '子森', 'https://via.placeholder.com/300x200/3B82F6/FFFFFF?text=QFT', 1800, '私教', 'physics,quantum,field theory', '72:30', FALSE),
(7, 'Quantum Computing', '子森', 'https://via.placeholder.com/300x200/3B82F6/FFFFFF?text=Computing', 1650, '私教', 'physics,quantum,computing', '58:25', TRUE),
(8, 'Quantum Entanglement', '子森', 'https://via.placeholder.com/300x200/3B82F6/FFFFFF?text=Entanglement', 1950, '私教', 'physics,quantum,entanglement', '42:15', FALSE);

-- Add instructor_id column if it doesn't exist
ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_id INT;

-- Set instructor_id based on instructor names
UPDATE courses SET instructor_id = 1 WHERE instructor = '陈浩老师';
UPDATE courses SET instructor_id = 2 WHERE instructor = '子森';

-- Show the results for verification
SELECT 'Instructors:' AS '';
SELECT * FROM instructors;
SELECT 'Courses:' AS '';
SELECT * FROM courses;