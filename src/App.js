import React, { useState, useEffect } from 'react';
import './App.css';
import SubmissionsTable from './components/SubmissionsTable';
import { querySubmissions, queryDiffs } from './services/api';

function App() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to fetch diffs and return the iframe URL
  const handleRowClick = async (params) => {
    const { 
      id, 
      msid, 
      publishedRevision, 
      requestedRevision, 
      status, 
      comment, 
      publishedUrl,
      editedUrl,
      url,
      userId,
      userEmail
    } = params;

    console.log('🔍 DEBUG: Starting handleRowClick for submission:', id);
    console.log('🔍 DEBUG: Params:', params);

    // 1) Fetch diffs for this submission
    console.log('🔍 DEBUG: Calling queryDiffs API...');
    const diffsResponse = await queryDiffs(id);
    console.log('🔍 DEBUG: Raw diffsResponse:', diffsResponse);
    const diffs = diffsResponse || {};
    console.log('🔍 DEBUG: Processed diffs:', diffs);

    // 2) Build the URL with query params and serialized diffs
    const queryParams = new URLSearchParams({
      id: id || '',
      msid: msid || '',
      publishedRevision: publishedRevision || '',
      requestedRevision: requestedRevision || '',
      status: status || '',
      comment: comment || '',
      publishedUrl: publishedUrl || '',
      editedUrl: editedUrl || '',
      url: url || '',
      userId: userId || '',
      userEmail: userEmail || ''
    });

    // Important: Keep diffs small enough for URL. We'll encode as a compact string.
    const diffsString = encodeURIComponent(JSON.stringify(diffs));
    queryParams.set('diff', diffsString);

    // 3) Build the iframe page URL
    const iframePageUrl = `${window.location.origin}/iframe-poc.html?${queryParams.toString()}`;

    console.log('Diffs loaded successfully for submission:', id);
    console.log('URLs extracted:', { publishedUrl, editedUrl, url });
    
    // Return the URL instead of opening it immediately
    return iframePageUrl;
  };

  // Function to fetch submissions data
  const fetchSubmissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await querySubmissions();
      // Extract submissions from the API response structure
      const submissionsArray = data?.submissions || [];
      setSubmissions(submissionsArray);
      console.log('Loaded submissions:', submissionsArray.length);
    } catch (err) {
      setError(err.message || 'Failed to fetch submissions');
      console.error('Error fetching submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchSubmissions();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Workflow Submissions Manager</h1>
        <button 
          className="refresh-button" 
          onClick={fetchSubmissions}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </header>
      <main className="App-main">
        <SubmissionsTable
          submissions={submissions}
          onRowClick={handleRowClick}
          loading={loading}
          error={error}
        />
      </main>
    </div>
  );
}

export default App;
