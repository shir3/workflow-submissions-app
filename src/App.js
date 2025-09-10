import React, { useState, useEffect } from 'react';
import './App.css';
import SubmissionsTable from './components/SubmissionsTable';
import { querySubmissions, queryDiffs } from './services/api';

function App() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to open iframe page with query parameters and diffs
  const handleRowClick = async (params) => {
    const { id, msid, publishedRevision, requestedRevision, status, comment } = params;

    try {
      // 1) Fetch diffs for this submission
      const diffsResponse = await queryDiffs(id);
      const diffs = diffsResponse || {};

      // 2) Build the URL with query params and serialized diffs
      const queryParams = new URLSearchParams({
        id: id || '',
        msid: msid || '',
        publishedRevision: publishedRevision || '',
        requestedRevision: requestedRevision || '',
        status: status || '',
        comment: comment || ''
      });

      // Important: Keep diffs small enough for URL. We'll encode as a compact string.
      const diffsString = encodeURIComponent(JSON.stringify(diffs));
      queryParams.set('diff', diffsString);

      // 3) Open the HTML file served from the React app's public directory
      const iframePageUrl = `${window.location.origin}/iframe-poc.html?${queryParams.toString()}`;

      console.log('Opening iframe page:', iframePageUrl);
      window.open(iframePageUrl, '_blank');
    } catch (err) {
      console.error('Failed to load diffs for submission', id, err);
      alert('Failed to load diffs for this submission. Please try again.');
    }
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
