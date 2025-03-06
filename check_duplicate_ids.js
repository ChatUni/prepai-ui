import mysql from 'mysql2/promise';

// Database connection configuration
const dbConfig = {
  host: 'localhost',
  user: 'root',
  database: 'prepai_courses'
};

async function checkDuplicateIds() {
  let connection;
  
  try {
    // Create a connection to the database
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL database');
    
    // Get all courses
    const [courses] = await connection.execute('SELECT * FROM courses');
    console.log(`Total courses: ${courses.length}`);
    
    // Check for duplicate IDs
    const ids = courses.map(course => course.id);
    const uniqueIds = new Set(ids);
    console.log(`Unique IDs: ${uniqueIds.size}`);
    
    if (ids.length !== uniqueIds.size) {
      console.log('Duplicate IDs found!');
      
      // Find the duplicate IDs
      const idCounts = {};
      ids.forEach(id => {
        idCounts[id] = (idCounts[id] || 0) + 1;
      });
      
      // Print the duplicate IDs
      Object.entries(idCounts)
        .filter(([_, count]) => count > 1)
        .forEach(([id, count]) => {
          console.log(`ID ${id} appears ${count} times`);
          
          // Print the courses with this ID
          const duplicateCourses = courses.filter(course => course.id === parseInt(id));
          duplicateCourses.forEach(course => {
            console.log(`  - ${course.title} (${course.instructor})`);
          });
        });
    } else {
      console.log('No duplicate IDs found');
    }
    
    // Print all courses
    console.log('\nAll courses:');
    courses.forEach(course => {
      console.log(`${course.id}: ${course.title} (${course.instructor})`);
    });
  } catch (error) {
    console.error('Error checking for duplicate IDs:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the function
checkDuplicateIds();
