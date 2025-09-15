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
  const maxRetries = 4; // Increase retries for diff generation
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
  
  // Add delays based on retry count to allow for diff generation
  if (retryCount === 0) {
    console.log('🔍 DEBUG queryDiffs: Initial delay for API readiness...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Longer initial delay
  }

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
    
    // Check if result is empty, null, or doesn't contain meaningful diff data with actual changes
    const hasValidData = result && typeof result === 'object' && (() => {
      // Check if we have any non-empty diff arrays
      const diffSources = [
        result.diffs,
        result.editor_diffs,
        result.seo_diffs,
        result.theme_diffs,
        result.diffsRaw?.diffs || result.diffsRaw
      ];
      
      for (const diffSource of diffSources) {
        if (diffSource && typeof diffSource === 'object') {
          // Check each diff type for non-empty arrays
          for (const [key, value] of Object.entries(diffSource)) {
            if (Array.isArray(value) && value.length > 0) {
              console.log(`🔍 DEBUG queryDiffs: Found non-empty diff array in ${key}:`, value.length, 'items');
              return true;
            }
          }
        }
      }
      
      // Also check pagingMetadata count
      if (result.pagingMetadata && result.pagingMetadata.count > 0) {
        console.log('🔍 DEBUG queryDiffs: Found diffs via pagingMetadata count:', result.pagingMetadata.count);
        return true;
      }
      
      console.log('🔍 DEBUG queryDiffs: No non-empty diff arrays found');
      return false;
    })();
    
    if (!hasValidData) {
      console.warn('⚠️ DEBUG queryDiffs: Received empty or invalid diff data!');
      console.log('🔍 DEBUG queryDiffs: Result keys:', Object.keys(result || {}));
      
      // Retry if we haven't exceeded max retries
      if (retryCount < maxRetries) {
        console.log(`🔄 DEBUG queryDiffs: Retrying... attempt ${retryCount + 1}/${maxRetries}`);
        // Progressive delays: 3s, 4s, 5s, 6s to allow for diff generation
        const delay = 3000 + (retryCount * 1000);
        console.log(`🔄 DEBUG queryDiffs: Waiting ${delay/1000}s for diff generation...`);
        await new Promise(resolve => setTimeout(resolve, delay));
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
      // Progressive delays on error too: 2s, 3s, 4s, 5s
      const delay = 2000 + (retryCount * 1000);
      console.log(`🔄 DEBUG queryDiffs: Waiting ${delay/1000}s before retry after error...`);
      await new Promise(resolve => setTimeout(resolve, delay));
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
