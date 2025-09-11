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
console.log('WIX_ACCOUNT_ID:', process.env.WIX_ACCOUNT_ID ? 'SET' : 'MISSING');
console.log('WIX_AUTHORIZATION:', process.env.WIX_AUTHORIZATION ? 'SET' : 'MISSING');
console.log('WIX_XSRF_TOKEN:', process.env.WIX_XSRF_TOKEN ? 'SET' : 'MISSING');

// API Configuration - Using environment variables for security
const API_CONFIG = {
  wixAccountId: process.env.WIX_ACCOUNT_ID || "18e546b2-4f3a-4b5d-939f-51d15da11076",
  authorization: process.env.WIX_AUTHORIZATION || "IST.eyJraWQiOiJQb3pIX2FDMiIsImFsZyI6IlJTMjU2In0.eyJkYXRhIjoie1wiaWRcIjpcIjg5ZDNiNzNmLTMzYzAtNDk1Ny04YWIzLWNmOGYyZmJjOWJjNVwiLFwiaWRlbnRpdHlcIjp7XCJ0eXBlXCI6XCJhcHBsaWNhdGlvblwiLFwiaWRcIjpcIjg3YjlmZGU2LTRkNWYtNDNiMS05YmUzLWMzNjJjZmEwYzcyOVwifSxcInRlbmFudFwiOntcInR5cGVcIjpcImFjY291bnRcIixcImlkXCI6XCIxOGU1NDZiMi00ZjNhLTRiNWQtOTM5Zi01MWQxNWRhMTEwNzZcIn19IiwiaWF0IjoxNzU3NDg5NTE3fQ.c_UZYd9kOZGtTdqk7pyaUDsgRtHo74RjdFCz9s6186Uz31XwsKJhjiWPVsubx5_vbmzSETd6paQY78kiw45p4aRBdLyAWu6ihrizGx1apaXU5X6teJl_H7HMWmDijsucba7wrWJXFMf7IkMcBnb1giylMj_AFF1ln1Y46Jv7vvCUeT0oISbNgu-9MHOV4EWCF4QijgM8Ma5qWF4l0zSnIUAJkUYw-euHRwThpTteXR0tR2cmPgH3i1XSM2VRycg0GmDraFXSAbmlvM7W9DMv5UGrCGe2cng5XONYaqR_hgHBvvmOsX9BpYo7S8gX4Dj09frNGCq6BJXZ179Gz9tqQw",
  xsrfToken: process.env.WIX_XSRF_TOKEN || "1757574739|XHsAjJ-xA3uz"
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
    // Use the new query format with sorting by creation date (most recent first)
    const requestBody = {
      "query": {
        "sort": [
          {
            "order": "DESC",
            "field_name": "createdDate"
          }
        ]
      }
    };
    
    console.log('\n=== SUBMISSIONS QUERY REQUEST ===');
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    console.log('Request headers:', JSON.stringify(createHeaders(), null, 2));
    
    const response = await fetch('https://www.wixapis.com/enterprise/workflow/v1/enriched-submissions/query', {
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

// Proxy endpoint for publishing/approving submissions
app.post('/api/submissions/approve', async (req, res) => {
  try {
    const { submission_id, approver_user_email } = req.body;
    
    if (!submission_id) {
      console.log('\n⚠️  Missing submission_id in request body');
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'submission_id is required'
      });
    }
    
    // Use provided approver email or default
    const requestBody = {
      approver_user_email: approver_user_email || "br.owner1@test.com",
      submission_id: submission_id
    };
    
    console.log('\n=== APPROVE SUBMISSION REQUEST ===');
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    console.log('Request headers:', JSON.stringify(createHeaders(), null, 2));
    
    const response = await fetch('https://www.wixapis.com/enterprise/workflow/v1/submissions/approval', {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(requestBody)
    });

    console.log('\n=== APPROVE SUBMISSION RESPONSE ===');
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
      // If response is empty or just whitespace, return success
      if (!responseText.trim()) {
        data = { success: true, message: 'Submission approved successfully' };
      } else {
        data = JSON.parse(responseText);
      }
      console.log('\n✅ Parsed response data:', JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.log('\n⚠️  Non-JSON response, treating as success:', parseError.message);
      data = { success: true, message: 'Submission approved successfully', rawResponse: responseText };
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
