-- Use the database
USE prepai_courses;

-- Create instructors table if it doesn't exist
CREATE TABLE IF NOT EXISTS instructors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image VARCHAR(255)
);

-- Check if instructors exist, if not insert them
INSERT INTO instructors (id, name, description, image)
SELECT 1, '陈浩老师', '知名数学讲师，擅长高数、线性代数、概率论与数理统计等课程。', 'https://via.placeholder.com/150x150/F06292/FFFFFF?text=陈浩老师'
WHERE NOT EXISTS (SELECT 1 FROM instructors WHERE id = 1);

INSERT INTO instructors (id, name, description, image)
SELECT 2, '子森', '资深物理学讲师，专注于量子力学及其相关领域的研究和教学。', 'https://via.placeholder.com/150x150/3B82F6/FFFFFF?text=子森'
WHERE NOT EXISTS (SELECT 1 FROM instructors WHERE id = 2);

-- Verify instructors
SELECT * FROM instructors;