-- Create series table
CREATE TABLE IF NOT EXISTS series (
  id INT AUTO_INCREMENT PRIMARY KEY,
  instructor_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  `desc` TEXT,
  cover VARCHAR(255),
  FOREIGN KEY (instructor_id) REFERENCES instructors(id)
);

-- Create initial series data based on instructors
-- This creates one series per instructor as a starting point
INSERT INTO series (instructor_id, name, `desc`, cover)
SELECT id, CONCAT(name, ' Series'), CONCAT('Series by ', name), NULL 
FROM instructors;

-- Add series_id column to courses table
ALTER TABLE courses ADD COLUMN series_id INT;

-- Update courses to associate with series based on instructor_id
UPDATE courses c
JOIN series s ON c.instructor_id = s.instructor_id
SET c.series_id = s.id;

-- Add foreign key constraint
ALTER TABLE courses ADD CONSTRAINT fk_series_id FOREIGN KEY (series_id) REFERENCES series(id);

-- Remove instructor_id from courses table
-- First, find and drop any foreign key constraints on instructor_id
SET @constraint_name = (
  SELECT CONSTRAINT_NAME
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'courses'
    AND COLUMN_NAME = 'instructor_id'
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

-- Finally, drop the instructor_id column
ALTER TABLE courses DROP COLUMN instructor_id;