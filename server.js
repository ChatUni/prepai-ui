import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import apiHandlers from './functions/api/utils/apiHandlers.js';
import { connect } from './functions/api/utils/db.js';

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

const handleEndpoint = async (req, res) => {
  try {
    const q = req.query;
    const method = req.method.toLowerCase();

    let t = apiHandlers.db_handlers[method]?.[q.type]
    if (t) await connect(q.db || 'prepai')
    else t = apiHandlers.handlers[method]?.[q.type]
    if (!t) return res.status(404).json({ error: `Handler for ${q.type} not found` });

    const response = await t(q, req.body);
    res.status(200).json(response);
  } catch (error) {
    console.error(`Error in ${q.type}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

app.get('/api', handleEndpoint);
app.post('/api', handleEndpoint);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
