import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import apiHandlers from './utils/apiHandlers.js';
import { connect } from './utils/db.js';
import { parseForm } from './utils/http.js';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enable compression for all responses
app.use(compression());

// Enable CORS for all routes
app.use(cors());

// Custom middleware to handle both JSON and multipart data
app.use((req, res, next) => {
  const contentType = req.headers?.['content-type'] || '';
  
  if (contentType.includes('multipart/form-data')) {
    // For multipart data, collect raw body for busboy
    let body = Buffer.alloc(0);
    req.on('data', (chunk) => {
      body = Buffer.concat([body, chunk]);
    });
    req.on('end', async () => {
      try {
        // Create event object compatible with parseForm
        const event = {
          headers: req.headers,
          body: body.toString('base64')
        };
        req.parsedBody = await parseForm(event);
        
        // Convert the parsed data to match our expected format
        Object.keys(req.parsedBody).forEach(key => {
          const value = req.parsedBody[key];
          if (value && typeof value === 'object' && value.content) {
            // Convert from http.js format to our expected format
            req.parsedBody[key] = {
              name: value.filename,
              type: value.type,
              data: value.content
            };
          }
        });
        
        next();
      } catch (error) {
        console.error('Error parsing multipart data:', error);
        res.status(400).json({ error: 'Invalid multipart data' });
      }
    });
  } else {
    // For JSON data, use express.json middleware
    express.json({ limit: '50mb' })(req, res, next);
  }
});

// Serve static files from dist folder
app.use(express.static('dist'));

const handleEndpoint = async (req, res) => {
  const q = req.query;
  try {
    const method = req.method.toLowerCase();

    let t = apiHandlers.db_handlers[method]?.[q.type]
    if (t) await connect(q.db || 'prepai')
    else t = apiHandlers.handlers[method]?.[q.type]
    if (!t) return res.status(404).json({ error: `Handler for ${q.type} not found` });

    // Use parsed body for multipart data, otherwise use regular body
    const requestData = req.parsedBody || req.body;

    const response = await t(q, requestData, req);
    res.status(200).send(response);
  } catch (error) {
    console.error(`Error in ${q?.type || 'unknown'}:`, error);
    res.status(500).json({ error: error.message });
  }
};

app.get('/api', handleEndpoint);
app.post('/api', handleEndpoint);

// app.get('/(.*)/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'dist', 'index.html'));
// });

// SSL certificate options
const sslOptions = {
  cert: fs.readFileSync(path.join(__dirname, 'certs', 'full.pem')),
  key: fs.readFileSync(path.join(__dirname, 'certs', '20251014_43334.private.key'))
};

// Start the HTTPS server
https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`HTTPS Server running on https://localhost:${PORT}`);
});
