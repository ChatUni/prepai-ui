import OpenAI from 'openai';
import { parsePathParams } from './utils/pathUtils.js';

// Main handler function
export const handler = async (event, context) => {
  // Set default headers
  const headers = {
    'Content-Type': 'application/json',
  };

  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'OpenAI API key not configured' })
      };
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const { resource, id } = parsePathParams(event.path, 'openai');

    // Route handlers
    switch (`${event.httpMethod} /${resource}${id ? '/:id' : ''}`) {
      case 'POST /openai-chat':
        try {
          const body = JSON.parse(event.body);
          const messages = body.messages;
          if (!messages || !Array.isArray(messages)) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Messages array is required' })
            };
          }

          const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages,
            temperature: 0.7,
            max_tokens: 1000
          });

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(response)
          };
        } catch (error) {
          console.error('OpenAI API error:', error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to get response from OpenAI' })
          };
        }

      case 'GET /files':
        try {
          const filesList = await openai.files.list();
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ files: filesList.data })
          };
        } catch (error) {
          console.error('OpenAI API error:', error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to list OpenAI files' })
          };
        }

      default:
        return { 
          statusCode: 404, 
          headers, 
          body: JSON.stringify({ error: 'Not found' }) 
        };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};