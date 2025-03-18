import { handler } from './netlify/functions/api-assistants.mjs';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Log environment variables to ensure they're loaded (without exposing sensitive values)
console.log('Environment variables loaded:');
console.log(`- DB_HOST: ${process.env.DB_HOST || 'not set'}`);
console.log(`- DB_PORT: ${process.env.DB_PORT || 'not set'}`);
console.log(`- DB_USER: ${process.env.DB_USER || 'not set'}`);
console.log(`- DB_DATABASE: ${process.env.DB_DATABASE || 'not set'}`);

async function testAssistantsApi() {
  console.log('\nTesting Assistants API endpoint...');
  
  // Create a mock event object similar to what Netlify Functions expect
  const mockEvent = {
    httpMethod: 'GET',
    headers: {
      'content-type': 'application/json'
    }
  };
  
  try {
    console.time('API Response Time');
    const result = await handler(mockEvent, {});
    console.timeEnd('API Response Time');
    
    console.log(`Status code: ${result.statusCode}`);
    
    if (result.statusCode === 200) {
      const assistants = JSON.parse(result.body);
      console.log(`✅ Success! Retrieved ${assistants.length} assistants:`);
      assistants.forEach(assistant => {
        console.log(`- ${assistant.name}`);
      });
    } else {
      console.log(`❌ Error: ${result.body}`);
    }
  } catch (error) {
    console.error('❌ Error executing handler:', error);
  }
}

// Run the test
testAssistantsApi().catch(console.error);