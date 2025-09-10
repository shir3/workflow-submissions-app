// API service functions for Wix Enterprise Workflow APIs
// Uses local proxy server to avoid CORS issues

const PROXY_BASE_URL = process.env.REACT_APP_PROXY_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001');

const createHeaders = () => {
  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  return headers;
};

// Extract URLs from enriched submissions response
const extractUrls = (submission) => {
  const url = submission?.url;
  const requestedRevision = submission?.revisions?.requestedRevision;
  
  if (!url) {
    return { publishedUrl: null, editedUrl: null };
  }
  
  const publishedUrl = url;
  const editedUrl = requestedRevision ? `${url}?siteRevision=${requestedRevision}` : url;
  
  return { publishedUrl, editedUrl };
};

// Process enriched submissions data
const processEnrichedSubmissions = (data) => {
  if (!data || !data.enrichedSubmissions) {
    return [];
  }
  
  return data.enrichedSubmissions.map(submission => {
    const { publishedUrl, editedUrl } = extractUrls(submission);
    
    return {
      ...submission,
      publishedUrl,
      editedUrl
    };
  });
};

export const querySubmissions = async (submissionId = "a2881742-6bd1-4aff-b73a-da5de1011dcc") => {
  const requestOptions = {
    method: "POST",
    headers: createHeaders(),
    body: JSON.stringify({
      submission_id: submissionId
    })
  };

  try {
    const response = await fetch(`${PROXY_BASE_URL}/api/submissions/query`, requestOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    // Process enriched submissions to extract URLs
    const processedSubmissions = processEnrichedSubmissions(result);
    
    // Return the processed data in the expected format
    return {
      ...result,
      submissions: processedSubmissions,
      enrichedSubmissions: processedSubmissions // Keep both for compatibility
    };
  } catch (error) {
    console.error("Error querying submissions:", error);
    throw error;
  }
};

export const queryDiffs = async (submissionId) => {
  if (!submissionId) {
    throw new Error('submission_id is required for querying diffs');
  }
  
  const requestOptions = {
    method: "POST",
    headers: createHeaders(),
    body: JSON.stringify({
      submission_id: submissionId
    })
  };

  try {
    const response = await fetch(`${PROXY_BASE_URL}/api/submissions/query-diffs`, requestOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error querying diffs:", error);
    throw error;
  }
};
