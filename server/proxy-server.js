const express = require('express');
const cors = require('cors');
const path = require('path');

// Load environment variables from .env.local in the project root
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const app = express();
const PORT = process.env.PORT || 3001;
const isDevelopment = process.env.NODE_ENV !== 'production';

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Debug environment variables
console.log('🔍 Environment Variables Debug:');
console.log('REACT_APP_WIX_ACCOUNT_ID:', process.env.REACT_APP_WIX_ACCOUNT_ID ? 'SET' : 'MISSING');
console.log('REACT_APP_WIX_AUTH:', process.env.REACT_APP_WIX_AUTH ? 'SET' : 'MISSING');
console.log('REACT_APP_WIX_XSRF:', process.env.REACT_APP_WIX_XSRF ? 'SET' : 'MISSING');

// API Configuration
const API_CONFIG = {
  wixAccountId: process.env.REACT_APP_WIX_ACCOUNT_ID,
  authorization: process.env.REACT_APP_WIX_AUTH,
  xsrfToken: process.env.REACT_APP_WIX_XSRF
};

// Debug API config
console.log('📋 API Config:');
console.log('wixAccountId:', API_CONFIG.wixAccountId || 'UNDEFINED');
console.log('authorization:', API_CONFIG.authorization ? 'SET' : 'UNDEFINED');
console.log('xsrfToken:', API_CONFIG.xsrfToken || 'UNDEFINED');

const createHeaders = () => {
  const headers = {
    "wix-account-id": API_CONFIG.wixAccountId,
    "Content-Type": "application/json",
    "Authorization": API_CONFIG.authorization
  };
  
  if (API_CONFIG.xsrfToken) {
    headers["Cookie"] = `XSRF-TOKEN=${API_CONFIG.xsrfToken}`;
  }
  
  return headers;
};

// Proxy endpoint for querying submissions
app.post('/api/submissions/query', async (req, res) => {
  try {
    const { submission_id } = req.body;
    const requestBody = {
      submission_id: submission_id || "a2881742-6bd1-4aff-b73a-da5de1011dcc"
    };
    
    console.log('\n=== SUBMISSIONS QUERY REQUEST ===');
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    console.log('Request headers:', JSON.stringify(createHeaders(), null, 2));
    
    const response = await fetch('https://www.wixapis.com/enterprise/workflow/v1/workflows/submissions/query', {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(requestBody)
    });

    console.log('\n=== SUBMISSIONS QUERY RESPONSE ===');
    console.log('Response status:', response.status, response.statusText);
    console.log('Response headers:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }

    const responseText = await response.text();
    console.log('Raw response body:', responseText);

    if (!response.ok) {
      console.error('\n❌ Wix API Error:', response.status, responseText);
      return res.status(response.status).json({ 
        error: `API Error: ${response.status}`,
        message: responseText
      });
    }

    let data;
    try {
      data = JSON.parse(responseText);
      console.log('\n✅ Parsed response data:', JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.error('\n❌ Failed to parse JSON response:', parseError.message);
      return res.status(500).json({ 
        error: 'Invalid JSON response',
        message: responseText
      });
    }

    res.json(data);
  } catch (error) {
    console.error('\n❌ Proxy server error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Proxy endpoint for querying diffs
app.post('/api/submissions/query-diffs', async (req, res) => {
  try {
    const { submission_id } = req.body;
    
    if (!submission_id) {
      console.log('\n⚠️  Missing submission_id in request body');
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'submission_id is required'
      });
    }
    
    const requestBody = { submission_id };
    
    console.log('\n=== QUERY DIFFS REQUEST ===');
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    console.log('Request headers:', JSON.stringify(createHeaders(), null, 2));
    
    const response = await fetch('https://www.wixapis.com/enterprise/workflow/v1/submissions/query-diffs', {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(requestBody)
    });

    console.log('\n=== QUERY DIFFS RESPONSE ===');
    console.log('Response status:', response.status, response.statusText);
    console.log('Response headers:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }

    const responseText = await response.text();
    console.log('Raw response body:', responseText);

    if (!response.ok) {
      console.error('\n❌ Wix API Error:', response.status, responseText);
      return res.status(response.status).json({ 
        error: `API Error: ${response.status}`,
        message: responseText
      });
    }

    let data;
    try {
      data = JSON.parse(responseText);
      console.log('\n✅ Parsed response data:', JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.error('\n❌ Failed to parse JSON response:', parseError.message);
      return res.status(500).json({ 
        error: 'Invalid JSON response',
        message: responseText
      });
    }

    res.json(data);
  } catch (error) {
    console.error('\n❌ Proxy server error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Only start server in development mode
if (isDevelopment) {
  app.listen(PORT, () => {
    console.log(`Proxy server running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
}

// Export for Vercel serverless functions
module.exports = app;
