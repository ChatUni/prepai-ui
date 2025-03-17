import mysql from 'mysql2/promise';

// Create a connection pool to the database
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'prepai',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

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
    console.log(`Query returned ${rows.length} rows`);
    return rows;
  } catch (error) {
    console.error('Database error:', error);
    throw error;
  }
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