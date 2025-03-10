import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import videoProcessingRouter from './server/videoProcessing.js';
import realtimeTokenRouter from './server/realtimeTokenEndpoint.js';

// Get current module's directory for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Add video processing routes
app.use('/api/video', videoProcessingRouter);

// Add realtime token endpoint
app.use(realtimeTokenRouter);

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD, // Password from .env file
  database: process.env.DB_DATABASE || 'prepai'
};

// Create a connection pool
let pool;

async function initializeDatabase() {
  try {
    pool = mysql.createPool(dbConfig);
    console.log('MySQL connection pool created successfully');
    
    // Test the connection
    const [rows] = await pool.execute('SELECT 1');
    console.log('Database connection test successful');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

// API endpoint to get all courses
app.get('/api/courses', async (req, res) => {
  try {
    // Get user ID from query parameter, default to 1 for development
    const userId = parseInt(req.query.userId || 1);
    
    // Join with favorites to include favorite status
    const [rows] = await pool.execute(`
      SELECT c.*,
             i.name AS instructor,
             CASE WHEN f.id IS NOT NULL THEN TRUE ELSE FALSE END AS isFavorite,
             COALESCE(c.recommended, FALSE) AS recommended,
             COALESCE(c.isVideo, TRUE) AS isVideo,
             c.transcript
      FROM courses c
      LEFT JOIN favorites f ON c.id = f.course_id AND f.user_id = ?
      LEFT JOIN instructors i ON i.id = c.instructor_id
    `, [userId]);
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses from database' });
  }
});

// API endpoint to get a course by ID
app.get('/api/courses/:id', async (req, res) => {
  const courseId = parseInt(req.params.id);
  // Get user ID from query parameter, default to 1 for development
  const userId = parseInt(req.query.userId || 1);
  
  try {
    const [rows] = await pool.execute(`
      SELECT c.*,
             i.name AS instructor,
             CASE WHEN f.id IS NOT NULL THEN TRUE ELSE FALSE END AS isFavorite,
             COALESCE(c.recommended, FALSE) AS recommended,
             COALESCE(c.isVideo, TRUE) AS isVideo,
             c.transcript
      FROM courses c
      LEFT JOIN favorites f ON c.id = f.course_id AND f.user_id = ?
      LEFT JOIN instructors i ON i.id = c.instructor_id
      WHERE c.id = ?
    `, [userId, courseId]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Failed to fetch course from database' });
  }
});

// API endpoint to toggle favorite status
app.post('/api/favorites/toggle', async (req, res) => {
  const { userId = 1, courseId } = req.body;
  
  if (!courseId) {
    return res.status(400).json({ error: 'Course ID is required' });
  }
  
  try {
    // Check if the favorite already exists
    const [existingFavorites] = await pool.execute(
      'SELECT id FROM favorites WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );
    
    if (existingFavorites.length > 0) {
      // If it exists, remove it
      await pool.execute(
        'DELETE FROM favorites WHERE user_id = ? AND course_id = ?',
        [userId, courseId]
      );
      res.json({ isFavorite: false, message: 'Removed from favorites' });
    } else {
      // If it doesn't exist, add it
      await pool.execute(
        'INSERT INTO favorites (user_id, course_id) VALUES (?, ?)',
        [userId, courseId]
      );
      res.json({ isFavorite: true, message: 'Added to favorites' });
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ error: 'Failed to toggle favorite status' });
  }
});

// API endpoint to get user's favorites
app.get('/api/favorites', async (req, res) => {
  // Get user ID from query parameter, default to 1 for development
  const userId = parseInt(req.query.userId || 1);
  
  try {
    const [rows] = await pool.execute(`
      SELECT c.*,
             TRUE as isFavorite,
             COALESCE(c.recommended, FALSE) AS recommended,
             COALESCE(c.isVideo, TRUE) AS isVideo
      FROM courses c
      JOIN favorites f ON c.id = f.course_id
      WHERE f.user_id = ?
    `, [userId]);
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Failed to fetch favorites from database' });
  }
});

// API endpoint to get random questions for a course
app.get('/api/questions/random', async (req, res) => {
  const courseId = parseInt(req.query.courseId);
  const count = parseInt(req.query.count) || 10;

  if (!courseId) {
    return res.status(400).json({ error: 'Course ID is required' });
  }

  try {
    // Cast count to number and use it directly in the query
    const [rows] = await pool.execute(`
      SELECT id, question, options, answer, course_id
      FROM questions
      WHERE course_id = ?
      ORDER BY RAND()
      LIMIT ${parseInt(count)}
    `, [courseId]);

    // Transform options from object to array and stringify
    const processedRows = rows.map(row => {
      // Convert options object to array of values
      const optionsArray = Object.values(row.options);
      return {
        ...row,
        options: JSON.stringify(optionsArray)
      };
    });

    return res.json(processedRows);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return res.status(500).json({ error: 'Failed to fetch questions from database' });
  }
});

// API endpoint to get all instructors
app.get('/api/instructors', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM instructors');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching instructors:', error);
    res.status(500).json({ error: 'Failed to fetch instructors from database' });
  }
});

// Initialize the database and start the server
async function startServer() {
  await initializeDatabase();
  
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
