-- Use the database
USE prepai_courses;

-- Add transcript column to the courses table
ALTER TABLE courses 
ADD COLUMN transcript TEXT DEFAULT NULL;

-- Log the change
SELECT 'Added transcript column to courses table' AS 'Info';