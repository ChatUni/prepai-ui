import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create database connection pool with SSL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: {
    rejectUnauthorized: false // Allow self-signed certificates
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const tables = [
  'Assistants',
  'courses',
  'favorites',
  'instructors',
  'questions',
  'series'
];

const exportDir = './db_export';

async function fetchTableData(tableName) {
  try {
    const [rows] = await pool.execute(`SELECT * FROM ${tableName}`);
    return rows;
  } catch (error) {
    console.error(`Error fetching data from ${tableName}:`, error);
    return [];
  }
}

async function saveToJson(data, tableName) {
  try {
    // Create export directory if it doesn't exist
    await fs.mkdir(exportDir, { recursive: true });
    
    const filePath = join(exportDir, `${tableName}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`Successfully exported ${tableName} to ${filePath}`);
  } catch (error) {
    console.error(`Error saving ${tableName} to JSON:`, error);
  }
}

async function exportAllTables() {
  console.log('Starting database export...');
  console.log('Database config:', {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    database: process.env.DB_DATABASE
  });
  
  try {
    for (const table of tables) {
      console.log(`Exporting ${table}...`);
      const data = await fetchTableData(table);
      if (data.length > 0) {
        await saveToJson(data, table);
        console.log(`Exported ${data.length} records from ${table}`);
      } else {
        console.log(`No data found in ${table}`);
      }
    }
    
    console.log('Database export completed!');
  } catch (error) {
    console.error('Export failed:', error);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

// Execute the export
exportAllTables().catch(error => {
  console.error('Export failed:', error);
  process.exit(1);
});