-- Create the instructors table
CREATE TABLE instructors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image VARCHAR(255)
);

-- Insert instructor data
INSERT INTO instructors (name, description, image) VALUES
('陈浩老师', '知名数学讲师，擅长高数、线性代数、概率论与数理统计等课程。', 'https://via.placeholder.com/150x150/F06292/FFFFFF?text=陈浩老师'),
('子森', '资深物理学讲师，专注于量子力学及其相关领域的研究和教学。', 'https://via.placeholder.com/150x150/3B82F6/FFFFFF?text=子森');

-- Add instructor?.id column to courses table
ALTER TABLE courses ADD COLUMN instructor?.id INT;

-- Update courses table with instructor?.id
UPDATE courses SET instructor?.id = (SELECT id FROM instructors WHERE name = '陈浩老师') WHERE instructor = '陈浩老师';
UPDATE courses SET instructor?.id = (SELECT id FROM instructors WHERE name = '子森') WHERE instructor = '子森';

-- Add foreign key constraint
ALTER TABLE courses ADD FOREIGN KEY (instructor?.id) REFERENCES instructors(id);

-- Remove instructor column
ALTER TABLE courses DROP COLUMN instructor;
