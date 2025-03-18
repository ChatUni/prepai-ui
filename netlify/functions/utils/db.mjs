import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Ensure environment variables are loaded when this file is imported directly (not via Netlify)
const isDirectImport = process.argv.length > 1 && process.argv[1].includes('test-assistants-api.js');

// If this is being imported directly in a test script, make sure we've loaded environment variables
if (isDirectImport && (!process.env.DB_HOST || !process.env.DB_USER)) {
  // Try to find and load the nearest .env file
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const projectRoot = join(__dirname, '..', '..', '..');
  
  // Attempt to manually load .env file
  try {
    const envPath = join(projectRoot, '.env');
    console.log(`Attempting to load environment variables from ${envPath}`);
    
    if (fs.existsSync(envPath)) {
      const envConfig = fs.readFileSync(envPath, 'utf8')
        .split('\n')
        .filter(line => line.trim() && !line.startsWith('#'))
        .reduce((acc, line) => {
          const [key, ...valueParts] = line.split('=');
          if (key && valueParts.length > 0) {
            acc[key.trim()] = valueParts.join('=').trim();
          }
          return acc;
        }, {});
      
      // Apply to process.env
      Object.keys(envConfig).forEach(key => {
        if (!process.env[key]) process.env[key] = envConfig[key];
      });
      
      console.log('Environment variables loaded successfully.');
    }
  } catch (error) {
    console.error('Error loading environment variables:', error);
  }
}

// Create a connection pool to the database
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'prepai', // Changed from DB_NAME to DB_DATABASE to match .env
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 30000 // Increase connection timeout to 30 seconds
});

// Log connection details for debugging (redacting password)
console.log(`Database connection config (netlify function): ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}, user: ${process.env.DB_USER}, database: ${process.env.DB_DATABASE || 'prepai'}`);

/**
 * Execute a SQL query
 * @param {string} sql - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<Array>} - Query results
 */
export async function executeQuery(sql, params = []) {
  try {
    console.log(`Executing query: ${sql}`);
    console.log('Query params:', params);
    
    const [rows] = await pool.execute(sql, params);
    console.log(`Query returned ${rows ? rows.length : 0} rows`);
    return rows;
  } catch (error) {
    // Enhance error logging with connection details
    console.error('Database error:', error);
    console.error(`Connection failed to: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    
    if (error.code === 'ETIMEDOUT') {
      console.error('Connection timed out. This may be due to:');
      console.error('- Network connectivity issues');
      console.error('- Firewall blocking the connection');
      console.error('- Database server is down or unreachable');
      console.error('- Incorrect host/port configuration');
    }
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Access denied. Check your database username and password.');
    }
    
    // In development mode, return fallback data for demo/testing
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Using fallback data for query due to database error');
      return getFallbackDataForQuery(sql);
    }
    
    throw error;
  }
}

/**
 * Get fallback data for specific SQL queries
 * @param {string} sql - SQL query
 * @returns {Array} - Fallback data
 */
function getFallbackDataForQuery(sql) {
  // Check if this is a query for assistants
  if (sql.includes('FROM Assistants')) {
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
  
  // Default empty array for other queries
  return [];
}

/**
 * Get a single record by ID
 * @param {string} table - Table name
 * @param {number} id - Record ID
 * @returns {Promise<Object>} - Record
 */
export async function getById(table, id) {
  const sql = `SELECT * FROM ${table} WHERE id = ?`;
  const results = await executeQuery(sql, [id]);
  return results.length > 0 ? results[0] : null;
}

/**
 * Insert a record
 * @param {string} table - Table name
 * @param {Object} data - Record data
 * @returns {Promise<Object>} - Insert result
 */
export async function insert(table, data) {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map(() => '?').join(', ');
  
  const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
  const result = await executeQuery(sql, values);
  
  return {
    id: result.insertId,
    ...data
  };
}

/**
 * Update a record
 * @param {string} table - Table name
 * @param {number} id - Record ID
 * @param {Object} data - Record data
 * @returns {Promise<Object>} - Update result
 */
export async function update(table, id, data) {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const setClause = keys.map(key => `${key} = ?`).join(', ');
  
  const sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
  await executeQuery(sql, [...values, id]);
  
  return {
    id,
    ...data
  };
}

/**
 * Delete a record
 * @param {string} table - Table name
 * @param {number} id - Record ID
 * @returns {Promise<boolean>} - Success status
 */
export async function remove(table, id) {
  const sql = `DELETE FROM ${table} WHERE id = ?`;
  const result = await executeQuery(sql, [id]);
  return result.affectedRows > 0;
}

export default {
  executeQuery,
  getById,
  insert,
  update,
  remove
};