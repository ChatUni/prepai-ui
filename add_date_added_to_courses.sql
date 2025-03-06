-- Add date_added column to courses table
ALTER TABLE courses ADD COLUMN date_added DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Update existing courses with random dates from the past year
UPDATE courses 
SET date_added = DATE_ADD(
    CURRENT_TIMESTAMP - INTERVAL 1 YEAR, 
    INTERVAL FLOOR(RAND() * 365) DAY
);