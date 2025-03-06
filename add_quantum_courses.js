import mysql from 'mysql2/promise';

// Database connection configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  database: 'prepai_courses'
};

// Quantum mechanics courses data
const quantumCourses = [
  {
    id: 9,
    title: '量子力学基础入门',
    instructor: '子森',
    image: 'https://via.placeholder.com/300x200/3B82F6/FFFFFF?text=Quantum',
    viewCount: 1850,
    category: '私教'
  },
  {
    id: 10,
    title: '量子纠缠与量子信息',
    instructor: '子森',
    image: 'https://via.placeholder.com/300x200/3B82F6/FFFFFF?text=Quantum',
    viewCount: 2100,
    category: '私教'
  },
  {
    id: 11,
    title: '量子计算导论',
    instructor: '子森',
    image: 'https://via.placeholder.com/300x200/3B82F6/FFFFFF?text=Quantum',
    viewCount: 1750,
    category: '私教'
  },
  {
    id: 12,
    title: '量子场论基础',
    instructor: '子森',
    image: 'https://via.placeholder.com/300x200/3B82F6/FFFFFF?text=Quantum',
    viewCount: 1600,
    category: '私教'
  },
  {
    id: 13,
    title: '量子力学数学方法',
    instructor: '子森',
    image: 'https://via.placeholder.com/300x200/3B82F6/FFFFFF?text=Quantum',
    viewCount: 1950,
    category: '私教'
  },
  {
    id: 14,
    title: '量子测量理论',
    instructor: '子森',
    image: 'https://via.placeholder.com/300x200/3B82F6/FFFFFF?text=Quantum',
    viewCount: 1450,
    category: '私教'
  },
  {
    id: 15,
    title: '量子相变与临界现象',
    instructor: '子森',
    image: 'https://via.placeholder.com/300x200/3B82F6/FFFFFF?text=Quantum',
    viewCount: 1350,
    category: '私教'
  },
  {
    id: 16,
    title: '量子光学与激光物理',
    instructor: '子森',
    image: 'https://via.placeholder.com/300x200/3B82F6/FFFFFF?text=Quantum',
    viewCount: 1550,
    category: '私教'
  }
];

async function addQuantumCourses() {
  let connection;
  
  try {
    // Create a connection to the database
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL database');
    
    // Insert each quantum course
    for (const course of quantumCourses) {
      const { id, title, instructor, image, viewCount, category } = course;
      
      // Check if the course already exists
      const [existingCourses] = await connection.execute(
        'SELECT * FROM courses WHERE id = ?',
        [id]
      );
      
      if (existingCourses.length > 0) {
        console.log(`Course with ID ${id} already exists, updating...`);
        
        // Update the existing course
        await connection.execute(
          'UPDATE courses SET title = ?, instructor = ?, image = ?, viewCount = ?, category = ? WHERE id = ?',
          [title, instructor, image, viewCount, category, id]
        );
      } else {
        console.log(`Adding new course: ${title}`);
        
        // Insert the new course
        await connection.execute(
          'INSERT INTO courses (id, title, instructor, image, viewCount, category) VALUES (?, ?, ?, ?, ?, ?)',
          [id, title, instructor, image, viewCount, category]
        );
      }
    }
    
    console.log('All quantum mechanics courses have been added to the database');
  } catch (error) {
    console.error('Error adding quantum courses:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the function
addQuantumCourses();
