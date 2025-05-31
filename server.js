import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { handleUrlSigning, handleFileUpload } from './netlify/functions/utils/cosServerHelper.js';

// Get current module's directory for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config();

// Verify required environment variables
const requiredEnvVars = [
  'TENCENT_SECRETID',
  'TENCENT_SECRETKEY',
  'TENCENT_BUCKET',
  'TENCENT_REGION'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please ensure these variables are set in your .env file');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for file uploads

// Helper to convert Netlify response format to Express response
const sendNetlifyResponse = (res, netlifyResponse) => {
  const { statusCode, body } = netlifyResponse;
  return res.status(statusCode).json(JSON.parse(body));
};

// Wrapper for handling async route handlers with Netlify function responses
const handleNetlifyEndpoint = (endpointName, handler) => async (req, res) => {
  try {
    const response = await handler(req.body);
    sendNetlifyResponse(res, response);
  } catch (error) {
    console.error(`Error in ${endpointName}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// COS Sign endpoint
app.post('/api/cos-sign', handleNetlifyEndpoint('cos-sign', 
  ({ url }) => handleUrlSigning(url)
));

// COS Upload endpoint
app.post('/api/cos-upload', handleNetlifyEndpoint('cos-upload',
  ({ file, key }) => handleFileUpload(file, key)
));

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Environment variables loaded:', {
    TENCENT_BUCKET: process.env.TENCENT_BUCKET,
    TENCENT_REGION: process.env.TENCENT_REGION,
    // Don't log sensitive credentials
    TENCENT_SECRETID: process.env.TENCENT_SECRETID ? '***' : undefined,
    TENCENT_SECRETKEY: process.env.TENCENT_SECRETKEY ? '***' : undefined
  });
});
