// API service functions for Wix Enterprise Workflow APIs
// Uses local proxy server to avoid CORS issues

const PROXY_BASE_URL = process.env.REACT_APP_PROXY_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001');

console.log('🔧 DEBUG API CONFIG:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('REACT_APP_PROXY_URL:', process.env.REACT_APP_PROXY_URL);
console.log('PROXY_BASE_URL:', PROXY_BASE_URL);

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

export const queryDiffs = async (submissionId, retryCount = 0) => {
  const maxRetries = 2;
  console.log('🔍 DEBUG queryDiffs: Starting with submissionId:', submissionId, 'retry:', retryCount);
  
  if (!submissionId) {
    console.error('🔍 DEBUG queryDiffs: No submissionId provided!');
    throw new Error('submission_id is required for querying diffs');
  }
  
  const requestOptions = {
    method: "POST",
    headers: createHeaders(),
    body: JSON.stringify({
      submission_id: submissionId
    })
  };
  
  console.log('🔍 DEBUG queryDiffs: Request options:', requestOptions);
  console.log('🔍 DEBUG queryDiffs: Proxy URL:', `${PROXY_BASE_URL}/api/submissions/query-diffs`);

  try {
    console.log('🔍 DEBUG queryDiffs: Making fetch request...');
    const response = await fetch(`${PROXY_BASE_URL}/api/submissions/query-diffs`, requestOptions);
    
    console.log('🔍 DEBUG queryDiffs: Response status:', response.status);
    console.log('🔍 DEBUG queryDiffs: Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      console.error('🔍 DEBUG queryDiffs: Response not OK:', response.status);
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('🔍 DEBUG queryDiffs: Error data:', errorData);
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    console.log('🔍 DEBUG queryDiffs: Getting response JSON...');
    const result = await response.json();
    console.log('🔍 DEBUG queryDiffs: Final result:', result);
    console.log('🔍 DEBUG queryDiffs: Result type:', typeof result);
    console.log('🔍 DEBUG queryDiffs: Result keys:', Object.keys(result || {}));
    
    // Check if result is empty or null
    if (!result || (typeof result === 'object' && Object.keys(result).length === 0)) {
      console.warn('⚠️ DEBUG queryDiffs: Received empty or null result!');
      
      // Retry if we haven't exceeded max retries
      if (retryCount < maxRetries) {
        console.log(`🔄 DEBUG queryDiffs: Retrying... attempt ${retryCount + 1}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        return queryDiffs(submissionId, retryCount + 1);
      }
      
      console.log('🔍 DEBUG queryDiffs: Max retries reached, returning empty object as fallback');
      return {};
    }
    
    return result;
  } catch (error) {
    console.error("😱 Error querying diffs:", error);
    console.error('🔍 DEBUG queryDiffs: Error stack:', error.stack);
    
    // Retry on error if we haven't exceeded max retries
    if (retryCount < maxRetries) {
      console.log(`🔄 DEBUG queryDiffs: Retrying due to error... attempt ${retryCount + 1}/${maxRetries}`);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Wait 1.5 seconds on error
      return queryDiffs(submissionId, retryCount + 1);
    }
    
    throw error;
  }
};

export const approveSubmission = async (submissionId, approverUserEmail = "br.owner1@test.com") => {
  if (!submissionId) {
    throw new Error('submission_id is required for approving submissions');
  }
  
  const requestOptions = {
    method: "POST",
    headers: createHeaders(),
    body: JSON.stringify({
      submission_id: submissionId,
      approver_user_email: approverUserEmail
    })
  };

  try {
    const response = await fetch(`${PROXY_BASE_URL}/api/submissions/approve`, requestOptions);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error approving submission:", error);
    throw error;
  }
};
