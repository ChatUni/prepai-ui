import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { Blob } from 'buffer';
import { FormData } from '@web-std/form-data';
import { File } from '@web-std/file';
import { getResponseHeaders } from './utils/headers.js';

// Database configuration
const getDbConfig = () => ({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || 'prepai',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Create database pool
let pool;

// Initialize database connection
const initializeDatabase = async () => {
  if (!pool) {
    try {
      pool = mysql.createPool(getDbConfig());
      await pool.execute('SELECT 1');
      console.log('Database connection successful');
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }
};

export const handler = async (event, context) => {
  // Handle OPTIONS requests for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: getResponseHeaders()
    };
  }

  const headers = getResponseHeaders();

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const id = event.path.split('/').pop();
  if (!id) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Series ID is required' })
    };
  }

  try {
    await initializeDatabase();

    // 1. Get series details with instructor
    const [seriesRows] = await pool.execute(`
      SELECT s.*, i.name as instructor?.name
      FROM series s
      LEFT JOIN instructors i ON s.instructor?.id = i.id
      WHERE s.id = ?
    `, [parseInt(id)]);

    if (seriesRows.length === 0) {
      return { 
        statusCode: 404, 
        headers, 
        body: JSON.stringify({ error: 'Series not found' }) 
      };
    }

    const series = seriesRows[0];

    // Delete existing vector store if it exists
    if (series.vector_store_id) {
      const deleteResponse = await fetch(`${event.rawUrl.split('/vector-store/')[0]}/openai/vector_stores/${series.vector_store_id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!deleteResponse.ok) {
        console.error('Failed to delete existing vector store');
      }
    }

    // 2. Get all courses for this series
    const [coursesRows] = await pool.execute(`
      SELECT id, title, transcript
      FROM courses
      WHERE series?.id = ?
    `, [parseInt(id)]);

    // 3. Create vector store
    const vectorStoreName = `${series.instructor?.name} - ${series.name}`;
    const vectorStoreResponse = await fetch(`${event.rawUrl.split('/vector-store/')[0]}/openai/vector_stores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: vectorStoreName })
    });

    if (!vectorStoreResponse.ok) {
      throw new Error('Failed to create vector store');
    }

    const vectorStore = await vectorStoreResponse.json();

    // 4. Save vector store ID to series table
    await pool.execute(`
      UPDATE series
      SET vector_store_id = ?
      WHERE id = ?
    `, [vectorStore.id, parseInt(id)]);

    // 5. Process each course transcript
    for (const course of coursesRows) {
      if (!course.transcript) continue;

      // Create temp file
      const tmpDir = '/tmp/transcripts';
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }

      const tempFilePath = path.join(tmpDir, `prepai-transcript-${course.id}.txt`);
      fs.writeFileSync(tempFilePath, course.transcript);

      // Read file content and create form data
      const fileContent = fs.readFileSync(tempFilePath);
      const uploadFile = new File([fileContent], path.basename(tempFilePath), { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', uploadFile);

      // Upload file
      const fileResponse = await fetch(`${event.rawUrl.split('/vector-store/')[0]}/openai/files`, {
        method: 'POST',
        body: formData
      });

      if (!fileResponse.ok) {
        console.error(`Failed to upload transcript for course ${course.id}`);
        continue;
      }

      const uploadedFile = await fileResponse.json();

      // Add file to vector store
      const addFileResponse = await fetch(`${event.rawUrl.split('/vector-store/')[0]}/openai/vector_store_files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vectorStoreId: vectorStore.id,
          fileId: uploadedFile.id
        })
      });

      if (!addFileResponse.ok) {
        console.error(`Failed to add file to vector store for course ${course.id}`);
      }

      // Clean up temp file
      fs.unlinkSync(tempFilePath);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Vector store created successfully',
        vectorStoreId: vectorStore.id
      })
    };
  } catch (error) {
    console.error('Error creating vector store:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to create vector store' })
    };
  }
};