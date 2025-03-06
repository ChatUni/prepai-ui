-- Use the database
USE prepai_courses;

-- Add more courses with 子森 as the instructor, focusing on quantum mechanics
INSERT INTO courses (id, title, instructor, image, viewCount, category) VALUES
(9, '量子力学基础入门', '子森', 'https://via.placeholder.com/300x200/3B82F6/FFFFFF?text=Quantum', 1850, '私教'),
(10, '量子纠缠与量子信息', '子森', 'https://via.placeholder.com/300x200/3B82F6/FFFFFF?text=Quantum', 2100, '私教'),
(11, '量子计算导论', '子森', 'https://via.placeholder.com/300x200/3B82F6/FFFFFF?text=Quantum', 1750, '私教'),
(12, '量子场论基础', '子森', 'https://via.placeholder.com/300x200/3B82F6/FFFFFF?text=Quantum', 1600, '私教'),
(13, '量子力学数学方法', '子森', 'https://via.placeholder.com/300x200/3B82F6/FFFFFF?text=Quantum', 1950, '私教'),
(14, '量子测量理论', '子森', 'https://via.placeholder.com/300x200/3B82F6/FFFFFF?text=Quantum', 1450, '私教'),
(15, '量子相变与临界现象', '子森', 'https://via.placeholder.com/300x200/3B82F6/FFFFFF?text=Quantum', 1350, '私教'),
(16, '量子光学与激光物理', '子森', 'https://via.placeholder.com/300x200/3B82F6/FFFFFF?text=Quantum', 1550, '私教');
