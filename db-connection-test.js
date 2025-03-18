import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Display connection parameters (without password)
console.log('Database Connection Parameters:');
console.log(`- Host: ${process.env.DB_HOST || 'localhost'}`);
console.log(`- Port: ${process.env.DB_PORT || 3306}`);
console.log(`- User: ${process.env.DB_USER || 'root'}`);
console.log(`- Database: ${process.env.DB_DATABASE || 'prepai'}`);
console.log(`- Connection Timeout: 30 seconds`);

async function testDatabaseConnection() {
  // Database connection configuration
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'prepai',
    connectTimeout: 30000 // 30 seconds
  };

  console.log(`\nAttempting to connect to ${config.host}:${config.port}...`);

  try {
    // Create a standalone connection for testing
    console.time('Connection time');
    const connection = await mysql.createConnection(config);
    console.timeEnd('Connection time');

    console.log('\n✅ Database connection successful!');
    
    // Test a simple query
    console.log('\nTesting query execution...');
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM Assistants');
    console.log(`Found ${rows[0].count} assistants in database.`);
    
    // Close the connection
    await connection.end();
    console.log('\nConnection closed.');
    
    return true;
  } catch (error) {
    console.log('\n❌ Database connection failed:');
    console.error(error);
    
    // Enhanced diagnostics based on error type
    if (error.code === 'ETIMEDOUT') {
      console.log('\nConnection timeout. Possible causes:');
      console.log('1. The database server is unreachable at the specified host/port');
      console.log('2. Network connectivity issues (firewall, VPN, etc.)');
      console.log('3. The database server is under heavy load or down');
      
      console.log('\nTroubleshooting steps:');
      console.log('1. Check network connectivity to the database server:');
      console.log(`   - Try pinging the server: ping ${process.env.DB_HOST}`);
      console.log(`   - Try telnet: telnet ${process.env.DB_HOST} ${process.env.DB_PORT}`);
      console.log('2. Verify the database credentials in your .env file');
      console.log('3. Check if the database server is running');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\nAccess denied. Possible causes:');
      console.log('1. Incorrect username or password');
      console.log('2. The user does not have permission to access the database');
      
      console.log('\nTroubleshooting steps:');
      console.log('1. Verify the database credentials in your .env file');
      console.log('2. Check if the user has appropriate permissions');
    } else if (error.code === 'ENOTFOUND') {
      console.log('\nHost not found. Possible causes:');
      console.log('1. The hostname does not exist or cannot be resolved');
      console.log('2. DNS resolution issues');
      
      console.log('\nTroubleshooting steps:');
      console.log('1. Check if the hostname is correct in your .env file');
      console.log('2. Try using an IP address instead of a hostname');
    }
    
    return false;
  }
}

// Run the connection test
testDatabaseConnection().then(success => {
  console.log('\nTest completed.');
  process.exit(success ? 0 : 1);
});