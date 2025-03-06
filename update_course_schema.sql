-- Use the database
USE prepai_courses;

-- Add keywords and duration columns to the courses table
ALTER TABLE courses 
ADD COLUMN keywords VARCHAR(255) DEFAULT NULL,
ADD COLUMN duration VARCHAR(50) DEFAULT '32:36';

-- Update existing courses with keywords
UPDATE courses SET keywords = '大学,数学,高数' WHERE id IN (1, 2, 3, 4);
UPDATE courses SET keywords = '大学,数学,线性代数' WHERE id = 5;
UPDATE courses SET keywords = '大学,数学,概率论' WHERE id = 6;
UPDATE courses SET keywords = '大学,数学,微积分' WHERE id = 7;
UPDATE courses SET keywords = '大学,数学,建模' WHERE id = 8;

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_favorite (user_id, course_id),
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- For development, add some sample favorites for user ID 1
INSERT INTO favorites (user_id, course_id) VALUES
(1, 1),
(1, 3),
(1, 5);
