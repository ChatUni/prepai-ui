-- Update existing records to set isVideo = true
UPDATE courses SET isVideo = TRUE;

-- Add new records with isVideo = false (non-video courses)
INSERT INTO courses 
(id, title, image, viewCount, category, keywords, duration, recommended, video_url, instructor?.id, isVideo) 
VALUES 
(
  17,
  '数学入门', 
  'https://res.cloudinary.com/daqc8bim3/image/upload/v1740922900/cover1.png',
  100,
  '数学', 
  'mathematics,fundamentals,introduction',
  '60:00',
  TRUE,
  'https://res.cloudinary.com/daqc8bim3/raw/upload/v1740922908/math1.ppt',
  1, 
  FALSE
),
(
  18,
  '高级代数', 
  'https://res.cloudinary.com/daqc8bim3/image/upload/v1740922900/cover1.png',
  80,
  '数学', 
  'algebra,equations,functions',
  '90:00',
  FALSE,
  'https://res.cloudinary.com/daqc8bim3/raw/upload/v1740922908/math1.ppt',
  1, 
  FALSE
),
(
  19,
  '统计学基础', 
  'https://res.cloudinary.com/daqc8bim3/image/upload/v1740922900/cover1.png',
  120,
  '数学', 
  'statistics,data analysis,probability',
  '75:00',
  TRUE,
  'https://res.cloudinary.com/daqc8bim3/raw/upload/v1740922908/math1.ppt',
  2, 
  FALSE
),
(
  20,
  '微积分 I', 
  'https://res.cloudinary.com/daqc8bim3/image/upload/v1740922900/cover1.png',
  150,
  '数学', 
  'calculus,derivatives,integrals',
  '105:00',
  FALSE,
  'https://res.cloudinary.com/daqc8bim3/raw/upload/v1740922908/math1.ppt',
  2, 
  FALSE
);