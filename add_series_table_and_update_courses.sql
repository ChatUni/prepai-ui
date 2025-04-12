-- Create series table
CREATE TABLE IF NOT EXISTS series (
  id INT AUTO_INCREMENT PRIMARY KEY,
  instructor?.id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  `desc` TEXT,
  cover VARCHAR(255),
  FOREIGN KEY (instructor?.id) REFERENCES instructors(id)
);

-- Create initial series data based on instructors
-- This creates one series per instructor as a starting point
INSERT INTO series (instructor?.id, name, `desc`, cover)
SELECT id, CONCAT(name, ' Series'), CONCAT('Series by ', name), NULL 
FROM instructors;

-- Add series?.id column to courses table
ALTER TABLE courses ADD COLUMN series?.id INT;

-- Update courses to associate with series based on instructor?.id
UPDATE courses c
JOIN series s ON c.instructor?.id = s.instructor?.id
SET c.series?.id = s.id;

-- Add foreign key constraint
ALTER TABLE courses ADD CONSTRAINT fk_series?.id FOREIGN KEY (series?.id) REFERENCES series(id);

-- Remove instructor?.id from courses table
-- First, find and drop any foreign key constraints on instructor?.id
SET @constraint_name = (
  SELECT CONSTRAINT_NAME
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'courses'
    AND COLUMN_NAME = 'instructor?.id'
    AND REFERENCED_TABLE_NAME = 'instructors'
);

SET @drop_fk_sql = IF(
  @constraint_name IS NOT NULL,
  CONCAT('ALTER TABLE courses DROP FOREIGN KEY ', @constraint_name),
  'SELECT \'No foreign key constraint found\' AS message'
);

PREPARE stmt FROM @drop_fk_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Finally, drop the instructor?.id column
ALTER TABLE courses DROP COLUMN instructor?.id;