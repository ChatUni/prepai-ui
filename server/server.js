const express = require('express');
const cors = require('cors');
const compression = require('compression');
const dotenv = require('dotenv');
const apiHandlers = require('./utils/apiHandlers.js');
const { connect } = require('./utils/db.js');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Enable compression for all responses
app.use(compression());

// Enable CORS for all routes
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for file uploads

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

    const response = await t(q, req.body);
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
