-- Add recommended column to courses table
-- First check if the column exists
SET @columnExists = 0;
SELECT COUNT(*) INTO @columnExists FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'courses' AND COLUMN_NAME = 'recommended';

-- Add the column only if it doesn't exist
SET @query = IF(@columnExists = 0,
                'ALTER TABLE courses ADD COLUMN recommended BOOLEAN DEFAULT FALSE',
                'SELECT "Column already exists"');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update specific courses to be recommended
UPDATE courses SET recommended = TRUE WHERE id IN (1, 3, 5, 7);

-- Make sure other courses are not recommended
UPDATE courses SET recommended = FALSE WHERE id NOT IN (1, 3, 5, 7);