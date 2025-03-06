import mysql from 'mysql2/promise';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

// Create readline interface for user input
const rl = readline.createInterface({ input, output });

async function getMySQLCredentials() {
  console.log('MySQL Connection Setup');
  console.log('======================');
  
  const host = await rl.question('Host (default: localhost): ') || 'localhost';
  const user = await rl.question('Username (default: root): ') || 'root';
  const password = await rl.question('Password (leave empty for no password): ');
  const database = await rl.question('Database (default: prepai_courses): ') || 'prepai_courses';
  
  return { host, user, password, database };
}

async function testConnection(config) {
  try {
    const connection = await mysql.createConnection(config);
    console.log('Connection successful!');
    
    // Test query
    const [result] = await connection.execute('SELECT 1');
    console.log('Query test successful.');
    
    await connection.end();
    return true;
  } catch (error) {
    console.error('Connection failed:', error.message);
    return false;
  }
}

async function saveConnectionConfig(config) {
  console.log('Creating .env file with your MySQL credentials...');
  
  const fs = await import('fs');
  const envContent = `# MySQL Database Configuration
DB_HOST=${config.host}
DB_USER=${config.user}
DB_PASSWORD=${config.password}
DB_DATABASE=${config.database}

# YouTube API Key (add your key here)
YOUTUBE_API_KEY=your_youtube_api_key_here
`;

  fs.writeFileSync('.env', envContent);
  console.log('.env file created successfully.');
}

async function updateFiles(config) {
  console.log('Updating database connection in files...');
  
  const fs = await import('fs');
  const serverJs = fs.readFileSync('server.js', 'utf8');
  const youtubeScript = fs.readFileSync('update_courses_with_youtube.cjs', 'utf8');
  
  // Update server.js
  const updatedServerJs = serverJs.replace(
    /const dbConfig = \{[\s\S]*?host:.*?['"].*?['"],[\s\S]*?user:.*?['"].*?['"],[\s\S]*?(password:.*?,[\s\S]*?)?database:.*?['"].*?['"][\s\S]*?\};/g,
    `const dbConfig = {
  host: process.env.DB_HOST || '${config.host}',
  user: process.env.DB_USER || '${config.user}',
  ${config.password ? `password: process.env.DB_PASSWORD, // Password from .env file` : ''}
  database: process.env.DB_DATABASE || '${config.database}'
};`
  );
  
  fs.writeFileSync('server.js', updatedServerJs);
  
  // Update update_courses_with_youtube.cjs
  const updatedYoutubeScript = youtubeScript.replace(
    /const dbConfig = \{[\s\S]*?host:.*?['"].*?['"],[\s\S]*?user:.*?['"].*?['"],[\s\S]*?(password:.*?,[\s\S]*?)?database:.*?['"].*?['"][\s\S]*?\};/g,
    `const dbConfig = {
  host: process.env.DB_HOST || '${config.host}',
  user: process.env.DB_USER || '${config.user}',
  ${config.password ? `password: process.env.DB_PASSWORD, // Password from .env file` : ''}
  database: process.env.DB_DATABASE || '${config.database}'
};`
  );
  
  fs.writeFileSync('update_courses_with_youtube.cjs', updatedYoutubeScript);
  
  console.log('Files updated successfully.');
}

async function main() {
  try {
    const config = await getMySQLCredentials();
    const connectionSuccess = await testConnection(config);
    
    if (connectionSuccess) {
      await saveConnectionConfig(config);
      await updateFiles(config);
      
      console.log('\nNext steps:');
      console.log('1. Add your YouTube API key to the .env file');
      console.log('2. Run the instructor update: mysql -u', config.user, config.password ? '-p' : '', '< update_instructors.sql');
      console.log('3. Run the YouTube update: node update_courses_with_youtube.cjs');
      console.log('4. Start the server: npm run server');
    } else {
      console.log('\nPlease check your MySQL configuration and try again.');
    }
  } catch (error) {
    console.error('An error occurred:', error);
  } finally {
    rl.close();
  }
}

main();