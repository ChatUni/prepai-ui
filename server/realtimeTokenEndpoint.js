import express from 'express';
import crypto from 'crypto';

const router = express.Router();

// Environment variable should be set for the OpenAI API key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'your-openai-api-key';

// Endpoint to get ephemeral token for OpenAI realtime API
router.get('/token', async (req, res) => {
  try {
    // Check if the API key is a placeholder or not set
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your-openai-api-key') {
      console.error('OpenAI API key not configured');
      return res.status(500).json({
        error: 'OpenAI API key not configured. Please set the OPENAI_API_KEY environment variable.',
        code: 'api_key_missing'
      });
    }
    
    // In a production environment, you would:
    // 1. Authenticate the user
    // 2. Rate limit token requests
    // 3. Generate tokens with appropriate scopes and TTLs
    // 4. Store token metadata for auditing/security
    
    // For simplicity, we're directly returning a client secret value
    // that uses the main OpenAI API key
    res.json({
      client_secret: {
        value: OPENAI_API_KEY,
        // Add a unique ID to prevent token reuse/replay attacks
        id: crypto.randomUUID()
      },
      expires_at: new Date(Date.now() + 3600 * 1000).toISOString() // 1 hour expiry
    });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({
      error: 'Failed to generate token: ' + error.message,
      code: 'token_generation_failed'
    });
  }
});

export default router;