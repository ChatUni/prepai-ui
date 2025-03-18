// Script to read JSON files from src/assets/assist and insert into Assistants table
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// ES Module equivalent for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection configuration with SSL options for self-signed certs
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  ssl: {
    // Allow self-signed certificates for development
    rejectUnauthorized: false
  }
};

// Function to create Assistants table if it doesn't exist
async function createAssistantsTable(connection) {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS Assistants (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      greeting TEXT NOT NULL,
      prompt TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  try {
    await connection.execute(createTableQuery);
    console.log('Assistants table created or already exists');
  } catch (error) {
    console.error('Error creating Assistants table:', error);
    throw error;
  }
}

// Function to read all assistant JSON files
async function readAssistantFiles() {
  const assistDir = path.join(__dirname, 'src', 'assets', 'assist');
  const files = fs.readdirSync(assistDir);
  
  const assistants = [];
  
  for (const file of files) {
    const filePath = path.join(assistDir, file);
    
    // Skip directories
    if (fs.statSync(filePath).isDirectory()) {
      continue;
    }
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const assistantData = JSON.parse(content);
      
      assistants.push({
        name: assistantData["Agent Name"],
        greeting: assistantData["Greetings"],
        prompt: assistantData["Prompt"]
      });
      
      console.log(`Successfully read: ${file}`);
    } catch (error) {
      console.error(`Error reading or parsing ${file}:`, error);
    }
  }
  
  return assistants;
}

// Function to insert assistants into the database
async function insertAssistants(connection, assistants) {
  const insertQuery = `
    INSERT INTO Assistants (name, greeting, prompt)
    VALUES (?, ?, ?)
  `;
  
  for (const assistant of assistants) {
    try {
      await connection.execute(insertQuery, [
        assistant.name,
        assistant.greeting,
        assistant.prompt
      ]);
      console.log(`Inserted assistant: ${assistant.name}`);
    } catch (error) {
      console.error(`Error inserting assistant ${assistant.name}:`, error);
    }
  }
}

// Main function
async function main() {
  let connection;
  
  try {
    // Connect to the database
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to the database');
    
    // Create Assistants table if it doesn't exist
    await createAssistantsTable(connection);
    
    // Read assistant files
    const assistants = await readAssistantFiles();
    console.log(`Found ${assistants.length} assistants`);
    
    // Insert assistants into the database
    await insertAssistants(connection, assistants);
    
    console.log('All assistants inserted successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the script
main();