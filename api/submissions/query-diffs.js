const path = require('path');

// Load environment variables from .env.local in the project root
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

// API Configuration - Using environment variables for security
const API_CONFIG = {
  wixAccountId: process.env.WIX_ACCOUNT_ID || "18e546b2-4f3a-4b5d-939f-51d15da11076",
  authorization: process.env.WIX_AUTHORIZATION || "IST.eyJraWQiOiJQb3pIX2FDMiIsImFsZyI6IlJTMjU2In0.eyJkYXRhIjoie1wiaWRcIjpcIjg5ZDNiNzNmLTMzYzAtNDk1Ny04YWIzLWNmOGYyZmJjOWJjNVwiLFwiaWRlbnRpdHlcIjp7XCJ0eXBlXCI6XCJhcHBsaWNhdGlvblwiLFwiaWRcIjpcIjg3YjlmZGU2LTRkNWYtNDNiMS05YmUzLWMzNjJjZmEwYzcyOVwifSxcInRlbmFudFwiOntcInR5cGVcIjpcImFjY291bnRcIixcImlkXCI6XCIxOGU1NDZiMi00ZjNhLTRiNWQtOTM5Zi01MWQxNWRhMTEwNzZcIn19IiwiaWF0IjoxNzU3NDg5NTE3fQ.c_UZYd9kOZGtTdqk7pyaUDsgRtHo74RjdFCz9s6186Uz31XwsKJhjiWPVsubx5_vbmzSETd6paQY78kiw45p4aRBdLyAWu6ihrizGx1apaXU5X6teJl_H7HMWmDijsucba7wrWJXFMf7IkMcBnb1giylMj_AFF1ln1Y46Jv7vvCUeT0oISbNgu-9MHOV4EWCF4QijgM8Ma5qWF4l0zSnIUAJkUYw-euHRwThpTteXR0tR2cmPgH3i1XSM2VRycg0GmDraFXSAbmlvM7W9DMv5UGrCGe2cng5XONYaqR_hgHBvvmOsX9BpYo7S8gX4Dj09frNGCq6BJXZ179Gz9tqQw",
  xsrfToken: process.env.WIX_XSRF_TOKEN || "1757574739|XHsAjJ-xA3uz"
};

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

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { submission_id } = req.body;
    
    if (!submission_id) {
      console.log('⚠️  Missing submission_id in request body');
      return res.status(400).json({ 
        error: 'Bad Request',
        message: 'submission_id is required'
      });
    }
    
    const requestBody = { submission_id };
    
    console.log('=== QUERY DIFFS REQUEST ===');
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    console.log('Request headers:', JSON.stringify(createHeaders(), null, 2));
    
    const response = await fetch('https://www.wixapis.com/enterprise/workflow/v1/submissions/query-diffs', {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(requestBody)
    });

    console.log('=== QUERY DIFFS RESPONSE ===');
    console.log('Response status:', response.status, response.statusText);
    
    const responseText = await response.text();
    console.log('Raw response body:', responseText);

    if (!response.ok) {
      console.error('❌ Wix API Error:', response.status, responseText);
      return res.status(response.status).json({ 
        error: `API Error: ${response.status}`,
        message: responseText
      });
    }

    let data;
    try {
      data = JSON.parse(responseText);
      console.log('✅ Parsed response data:', JSON.stringify(data, null, 2));
    } catch (parseError) {
      console.error('❌ Failed to parse JSON response:', parseError.message);
      return res.status(500).json({ 
        error: 'Invalid JSON response',
        message: responseText
      });
    }

    res.json(data);
  } catch (error) {
    console.error('❌ Proxy server error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}
