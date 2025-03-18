import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// OpenAI API key from environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL = 'gpt-3.5-turbo'; // Default model, can be changed to gpt-4 if needed

// Using OpenAI API with key from environment

/**
 * Handler for POST /openai/chat endpoint
 * Forwards the request to OpenAI's chat completions API
 */
export async function handler(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  // Verify OpenAI API key is present
  if (!OPENAI_API_KEY) {
    console.error('OpenAI API key is missing from environment variables');
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'OpenAI API key is missing',
        details: 'Please check your server configuration'
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  }

  try {
    // Parse request body
    const requestBody = JSON.parse(event.body);
    
    // Validate request structure
    if (!requestBody.messages || !Array.isArray(requestBody.messages)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid request: messages array is required' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // Prepare OpenAI API request payload
    const openaiRequestPayload = {
      model: MODEL,
      messages: requestBody.messages,
      max_tokens: 2000,
      temperature: 0.7,
    };

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify(openaiRequestPayload)
    });

    // Handle OpenAI API response
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', errorData);
      
      return {
        statusCode: response.status,
        body: JSON.stringify({ 
          error: 'OpenAI API error', 
          details: errorData.error?.message || 'Unknown error' 
        }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    const responseData = await response.json();
    
    // Return OpenAI's response
    return {
      statusCode: 200,
      body: JSON.stringify(responseData),
      headers: { 'Content-Type': 'application/json' }
    };
    
  } catch (error) {
    console.error('Error processing OpenAI request:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to process OpenAI request', 
        details: error.message 
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
}