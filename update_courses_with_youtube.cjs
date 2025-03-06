// Using CommonJS module syntax
const mysql = require('mysql2/promise');
const fetch = require('node-fetch');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD, // Password from .env file
  database: process.env.DB_DATABASE || 'prepai_courses'
};

// YouTube API key - read from .env file
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

async function updateCoursesWithYouTubeVideos() {
  let connection;
  
  try {
    // Create a connection to the database
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL database');
    
    // Add video_url column if it doesn't exist
    await addVideoUrlColumnIfNeeded(connection);
    
    // Check if instructor_id column exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'prepai_courses'
      AND TABLE_NAME = 'courses'
      AND COLUMN_NAME = 'instructor_id'
    `);
    
    let courses = [];
    
    if (columns.length > 0) {
      // If instructor_id column exists, use it to join with instructors
      console.log('Using instructor_id to fetch courses with instructor information');
      [courses] = await connection.execute(`
        SELECT c.id, c.title, i.name as instructor_name
        FROM courses c
        JOIN instructors i ON c.instructor_id = i.id
      `);
    } else {
      // If instructor_id doesn't exist, assume we have instructor column
      console.log('Instructor_id column not found, checking for instructor column');
      const [instrColumns] = await connection.execute(`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = 'prepai_courses'
        AND TABLE_NAME = 'courses'
        AND COLUMN_NAME = 'instructor'
      `);
      
      if (instrColumns.length > 0) {
        // Use instructor column directly
        console.log('Using instructor column to fetch courses');
        [courses] = await connection.execute(`
          SELECT id, title, instructor as instructor_name
          FROM courses
        `);
      } else {
        // Neither column exists, fetch just id and title
        console.log('No instructor information found, fetching only course data');
        [courses] = await connection.execute(`
          SELECT id, title, 'Unknown' as instructor_name
          FROM courses
        `);
      }
    }
    
    console.log(`Found ${courses.length} courses to update`);
    
    // Update each course with YouTube video
    for (const course of courses) {
      await updateCourseWithYouTubeVideo(connection, course);
    }
    
    console.log('All courses have been updated with YouTube videos');
  } catch (error) {
    console.error('Error updating courses with YouTube videos:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

async function addVideoUrlColumnIfNeeded(connection) {
  try {
    // Check if video_url column exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'prepai_courses' 
      AND TABLE_NAME = 'courses' 
      AND COLUMN_NAME = 'video_url'
    `);
    
    // Add the column if it doesn't exist
    if (columns.length === 0) {
      console.log('Adding video_url column to courses table');
      await connection.execute('ALTER TABLE courses ADD COLUMN video_url VARCHAR(255)');
      console.log('video_url column added successfully');
    } else {
      console.log('video_url column already exists');
    }
  } catch (error) {
    console.error('Error adding video_url column:', error);
    throw error;
  }
}

async function updateCourseWithYouTubeVideo(connection, course) {
  try {
    const { id, title, instructor_name } = course;
    console.log(`Updating course: ${title} (ID: ${id})`);
    
    // Search for a YouTube video based on the course title and instructor
    const searchQuery = `${title} ${instructor_name} lecture`;
    const videoData = await searchYouTubeVideo(searchQuery);
    
    if (!videoData) {
      console.log(`No YouTube video found for course: ${title}`);
      return;
    }
    
    const { videoId, videoUrl, thumbnailUrl } = videoData;
    console.log(`Found YouTube video: ${videoUrl}`);
    
    // Update the course with the YouTube video URL and thumbnail
    await connection.execute(
      'UPDATE courses SET video_url = ?, image = ? WHERE id = ?',
      [videoUrl, thumbnailUrl, id]
    );
    
    console.log(`Course updated successfully: ${title}`);
  } catch (error) {
    console.error(`Error updating course ${course.title}:`, error);
  }
}

async function searchYouTubeVideo(courseTitle) {
  try {
    // Check if YouTube API key is provided
    if (!YOUTUBE_API_KEY) {
      console.error('YouTube API key is missing. Please add it to the .env file.');
      return null;
    }
    
    // Prepare the search query
    const query = encodeURIComponent(courseTitle);
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&maxResults=1&key=${YOUTUBE_API_KEY}`;
    
    // Make the API request
    const response = await fetch(url);
    const data = await response.json();
    
    // Check if we got any results
    if (!data.items || data.items.length === 0) {
      return null;
    }
    
    // Extract video information
    const videoId = data.items[0].id.videoId;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/0.jpg`;
    
    return { videoId, videoUrl, thumbnailUrl };
  } catch (error) {
    console.error('Error searching YouTube:', error);
    return null;
  }
}

// Run the function
updateCoursesWithYouTubeVideos();