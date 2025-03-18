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

// Log environment variables for debugging (without exposing sensitive values)
console.log('Environment Variables:');
console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`- PORT: ${process.env.PORT || '3001 (default)'}`);
console.log(`- DB_HOST: ${process.env.DB_HOST || 'not set'}`);
console.log(`- DB_DATABASE: ${process.env.DB_DATABASE || 'not set'}`);
console.log(`- OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'set' : 'not set'}`);

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Add video processing routes
app.use('/api/video', videoProcessingRouter);

// Add realtime token endpoint
app.use(realtimeTokenRouter);

// Proxy function requests to Netlify function handlers
import { handler as openAiChatHandler } from './netlify/functions/api-openai-chat.mjs';
import { handler as assistantsHandler } from './netlify/functions/api-assistants.mjs';

// Proxy OpenAI chat requests
app.post('/api/openai-chat', async (req, res) => {
  try {
    // Create an event object similar to what Netlify Functions expect
    const event = {
      httpMethod: 'POST',
      body: JSON.stringify(req.body),
      headers: req.headers
    };
    
    // Call the Netlify function handler
    const result = await openAiChatHandler(event, {});
    
    // Return the response
    res.status(result.statusCode).set(result.headers).send(result.body);
  } catch (error) {
    console.error('Error proxying OpenAI request:', error);
    res.status(500).json({ error: 'Failed to process OpenAI request' });
  }
});

// Proxy assistants requests
app.get('/api/assistants', async (req, res) => {
  try {
    // Create an event object similar to what Netlify Functions expect
    const event = {
      httpMethod: 'GET',
      queryStringParameters: req.query,
      headers: req.headers
    };
    
    // Call the Netlify function handler
    const result = await assistantsHandler(event, {});
    
    // Return the response
    res.status(result.statusCode).set(result.headers).send(result.body);
  } catch (error) {
    console.error('Error proxying assistants request:', error);
    res.status(500).json({ error: 'Failed to fetch assistants' });
  }
});

// Database connection configuration with improved timeout settings
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD, // Password from .env file
  database: process.env.DB_DATABASE || 'prepai',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 30000, // Increase connection timeout to 30 seconds
  acquireTimeout: 30000, // Increase acquire timeout
  timeout: 60000 // Increase overall timeout
};

// Create a connection pool
let pool;
let dbAvailable = false;

async function initializeDatabase() {
  try {
    // Log the database configuration (without sensitive info)
    console.log('Initializing database connection with:');
    console.log(`- Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`- Port: ${process.env.DB_PORT || 3306}`);
    console.log(`- User: ${process.env.DB_USER || 'root'}`);
    console.log(`- Database: ${process.env.DB_DATABASE || 'prepai'}`);
    
    // Create the pool with our enhanced configuration
    pool = mysql.createPool(dbConfig);
    console.log('MySQL connection pool created successfully');
    
    // Test the connection with timeout handling
    const connectionTest = async () => {
      try {
        const [rows] = await pool.execute('SELECT 1');
        return true;
      } catch (err) {
        throw err;
      }
    };
    
    // Create a timeout promise
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database connection test timed out after 10 seconds')), 10000)
    );
    
    // Race the connection test against the timeout
    await Promise.race([connectionTest(), timeout]);
    console.log('Database connection test successful');
    dbAvailable = true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    
    // Enhanced error logging based on error type
    if (error.code === 'ETIMEDOUT') {
      console.error('Connection timed out. This may be due to:');
      console.error('- Network connectivity issues');
      console.error('- Firewall blocking the connection');
      console.error('- Database server is down or unreachable');
      console.error('- Incorrect host/port configuration');
      console.error(`Current connection details: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Access denied. Check your database username and password.');
    } else if (error.code === 'ENOTFOUND') {
      console.error('Host not found. Check the database hostname.');
    }
    
    console.warn('Will continue without database connection - using mock data for development');
    dbAvailable = false;
    // Don't exit the process - allow the app to run with mock data
  }
}

// API endpoint to get all courses
app.get('/api/courses', async (req, res) => {
  try {
    // If database is not available, return mock data
    if (!dbAvailable) {
      console.log('Database not available - returning mock courses data');
      return res.json(getMockData('/courses'));
    }
    
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
      LEFT JOIN series s ON c.series_id = s.id
      LEFT JOIN instructors i ON i.id = s.instructor_id
    `, [userId]);
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching courses:', error);
    
    // Return mock data on error in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('Error in database query - returning mock courses data');
      return res.json(getMockData('/courses'));
    }
    
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
      LEFT JOIN series s ON c.series_id = s.id
      LEFT JOIN instructors i ON i.id = s.instructor_id
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

// API endpoint to get all assistants
app.get('/api/assistants', async (req, res) => {
  try {
    // If database is not available, return mock data
    if (!dbAvailable) {
      console.log('Database not available - returning mock assistants data');
      return res.json(getMockData('/assistants'));
    }
    
    // Try the database query with a timeout
    const queryPromise = pool.execute('SELECT id, name, greeting, prompt FROM Assistants');
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database query timed out after 5 seconds')), 5000);
    });
    
    // Race the query against the timeout
    const [rows] = await Promise.race([queryPromise, timeoutPromise]);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching assistants:', error);
    
    // Log more diagnostic information
    if (error.code === 'ETIMEDOUT') {
      console.error(`Database connection timed out. Host: ${process.env.DB_HOST}, Port: ${process.env.DB_PORT}`);
      console.error('This may be due to network issues or the database server being unreachable.');
    }
    
    // Return mock data on error in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('Error in database query - returning mock assistants data');
      return res.json(getMockData('/assistants'));
    }
    
    res.status(500).json({
      error: 'Failed to fetch assistants from database',
      details: error.message,
      code: error.code || 'UNKNOWN'
    });
  }
});

// API endpoint to get all series
app.get('/api/series', async (req, res) => {
  try {
    // Check if we need to filter by instructor
    const instructorId = req.query.instructor;
    
    let query = `
      SELECT s.*, i.name as instructor_name, i.description as instructor_bio, i.image as instructor_avatar
      FROM series s
      LEFT JOIN instructors i ON s.instructor_id = i.id
    `;
    
    const queryParams = [];
    
    // Add instructor filter if provided
    if (instructorId) {
      query += ` WHERE s.instructor_id = ?`;
      queryParams.push(instructorId);
    }
    
    // Add order by clause
    query += ` ORDER BY s.name`;
    
    const [rows] = await pool.execute(query, queryParams);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching series:', error);
    res.status(500).json({ error: 'Failed to fetch series from database' });
  }
});

// API endpoint to get a series by ID
app.get('/api/series/:id', async (req, res) => {
  const seriesId = parseInt(req.params.id);
  
  try {
    // First get the series details
    const [seriesRows] = await pool.execute(`
      SELECT s.*, i.name as instructor_name, i.description as instructor_bio, i.image as instructor_avatar
      FROM series s
      LEFT JOIN instructors i ON s.instructor_id = i.id
      WHERE s.id = ?
    `, [seriesId]);
    
    if (seriesRows.length === 0) {
      return res.status(404).json({ error: 'Series not found' });
    }
    
    // Then get the courses in this series
    const [coursesRows] = await pool.execute(`
      SELECT c.*
      FROM courses c
      WHERE c.series_id = ?
      ORDER BY c.position, c.title
    `, [seriesId]);
    
    // Combine series with its courses
    const result = {
      ...seriesRows[0],
      courses: coursesRows
    };
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching series by ID:', error);
    res.status(500).json({ error: 'Failed to fetch series from database' });
  }
});

// Function to generate mock data for development
function getMockData(endpoint) {
  console.log(`Generating mock data for endpoint: ${endpoint}`);
  
  if (endpoint === '/courses') {
    return [
      { id: 1, title: 'Mock Course 1', description: 'A mock course for testing', isVideo: true },
      { id: 2, title: 'Mock Course 2', description: 'Another mock course', isVideo: false }
    ];
  }
  
  if (endpoint.startsWith('/courses/')) {
    const id = parseInt(endpoint.split('/')[2]);
    return {
      id,
      title: `Mock Course ${id}`,
      description: 'A detailed mock course',
      isVideo: true
    };
  }
  
  if (endpoint === '/assistants') {
    return [
      {
        id: 1,
        name: 'Math',
        greeting: 'Hello! I\'m your Math assistant. How can I help you with mathematics today?',
        prompt: 'You are a helpful Math tutor. Provide clear explanations and step-by-step solutions to math problems.'
      },
      {
        id: 2,
        name: 'Physics',
        greeting: 'Hi there! I\'m your Physics assistant. What physics concept would you like to explore?',
        prompt: 'You are a knowledgeable Physics tutor. Explain physics concepts clearly and help with problem-solving.'
      },
      {
        id: 3,
        name: 'Chemistry',
        greeting: 'Welcome! I\'m your Chemistry assistant. What chemistry topic are you interested in?',
        prompt: 'You are a Chemistry expert. Help with chemical equations, concepts, and problem-solving.'
      }
    ];
  }
  
  return [];
}

// Initialize the database and start the server
async function startServer() {
  try {
    await initializeDatabase();
  } catch (error) {
    console.error('Database initialization error:', error);
    console.warn('Continuing without database connection - using mock data');
  }
  
  // Always start the server, even if database fails
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Database connection status: ${dbAvailable ? 'Connected' : 'Not connected (using mock data)'}`);
  });
}

startServer().catch(error => {
  console.error('Failed to start server:', error);
  // Don't exit - let's still try to run the server for development purposes
  console.log('Attempting to continue despite errors...');
});
