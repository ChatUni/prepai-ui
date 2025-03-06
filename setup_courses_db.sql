-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS prepai_courses;

-- Use the database
USE prepai_courses;

-- Create the courses table
CREATE TABLE IF NOT EXISTS courses (
  id INT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  instructor VARCHAR(100) NOT NULL,
  image VARCHAR(255) NOT NULL,
  viewCount INT NOT NULL,
  category VARCHAR(50) NOT NULL
);

-- Clear existing data
TRUNCATE TABLE courses;

-- Insert sample course data
INSERT INTO courses (id, title, instructor, image, viewCount, category) VALUES
(1, '高数上岸必修课程系列1', '陈浩老师', 'https://via.placeholder.com/300x200/F59E0B/FFFFFF?text=Course', 1250, '私教'),
(2, '高数上岸必修课程系列2', '陈浩老师', 'https://via.placeholder.com/300x200/F59E0B/FFFFFF?text=Course', 980, '私教'),
(3, '高数上岸必修课程系列3', '陈浩老师', 'https://via.placeholder.com/300x200/F59E0B/FFFFFF?text=Course', 1500, '私教'),
(4, '高数上岸必修课程系列4', '陈浩老师', 'https://via.placeholder.com/300x200/F59E0B/FFFFFF?text=Course', 850, '私教'),
(5, '线性代数基础课程', '陈浩老师', 'https://via.placeholder.com/300x200/F59E0B/FFFFFF?text=Course', 2200, '私教'),
(6, '概率论与数理统计', '陈浩老师', 'https://via.placeholder.com/300x200/F59E0B/FFFFFF?text=Course', 1800, '私教'),
(7, '微积分进阶课程', '陈浩老师', 'https://via.placeholder.com/300x200/F59E0B/FFFFFF?text=Course', 1650, '私教'),
(8, '数学建模实战', '陈浩老师', 'https://via.placeholder.com/300x200/F59E0B/FFFFFF?text=Course', 1950, '私教');
