const express = require('express');
const cors = require('cors');
const compression = require('compression');
const dotenv = require('dotenv');
const apiHandlers = require('./utils/apiHandlers.js');
const { connect } = require('./utils/db.js');
const { parseForm } = require('./utils/http.js');

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
    res.status(200).json(response);
  } catch (error) {
    console.error(`Error in ${q?.type || 'unknown'}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

app.get('/api', handleEndpoint);
app.post('/api', handleEndpoint);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
