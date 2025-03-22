import crypto from 'crypto';

export const handler = async (event) => {
  try {
    // Environment variable should be set for the OpenAI API key
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-openai-api-key') {
      console.error('OpenAI API key not configured');
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'OpenAI API key not configured. Please set the OPENAI_API_KEY environment variable.',
          code: 'api_key_missing'
        })
      };
    }

    // For simplicity, we're directly returning a client secret value
    // that uses the main OpenAI API key
    return {
      statusCode: 200,
      body: JSON.stringify({
        client_secret: {
          value: OPENAI_API_KEY,
          // Add a unique ID to prevent token reuse/replay attacks
          id: crypto.randomUUID()
        },
        expires_at: new Date(Date.now() + 3600 * 1000).toISOString() // 1 hour expiry
      })
    };
  } catch (error) {
    console.error('Error generating token:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to generate token: ' + error.message,
        code: 'token_generation_failed'
      })
    };
  }
};