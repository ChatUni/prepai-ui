-- Use the database
USE prepai_courses;

-- Add a sample SRT transcript to a video course
UPDATE courses
SET transcript = '2
00:00:08,150 --> 00:00:12,030
很高兴又看到这么多大一的同学。

3
00:00:12,800 --> 00:00:16,600
欢迎来到我们的课程，今天我们将学习一些基础概念。

4
00:00:17,500 --> 00:00:22,300
首先，我想强调学习的重要性和坚持不懈的价值。

5
00:00:23,000 --> 00:00:29,450
在这门课程中，我们会探讨许多有趣的主题和前沿技术。

6
00:00:30,100 --> 00:00:35,800
希望大家能够积极参与课堂讨论，提出自己的问题和见解。

7
00:00:36,500 --> 00:00:42,000
我相信，通过我们共同的努力，你们会在本学期取得很大的进步。'
WHERE isVideo = 1
LIMIT 1;

-- Log the change
SELECT 'Added sample SRT transcript to a video course' AS 'Info';

-- Display updated course
SELECT id, title, transcript 
FROM courses 
WHERE transcript IS NOT NULL
LIMIT 1;