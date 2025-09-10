import React from 'react';
import './SubmissionsTable.css';

const SubmissionsTable = ({ submissions, onRowClick, loading, error }) => {
  const [loadingRowId, setLoadingRowId] = React.useState(null);

  const handleRowClick = async (submission) => {
    // Extract the required parameters from the submission data
    const params = {
      id: submission.id,
      msid: submission.msid,
      publishedRevision: submission.siteRevisions?.publishedRevision || submission.revisions?.publishedRevision,
      requestedRevision: submission.siteRevisions?.requestedRevision || submission.revisions?.requestedRevision,
      status: submission.status,
      comment: submission.userPayload?.comment,
      userId: submission.userData?.user_id,
      userEmail: submission.userData?.user_email,
      publishedUrl: submission.publishedUrl,
      editedUrl: submission.editedUrl,
      url: submission.url
    };
    
    // Set loading state for this specific row
    setLoadingRowId(submission.id);
    
    try {
      await onRowClick(params);
    } finally {
      // Clear loading state after the operation completes
      setLoadingRowId(null);
    }
  };

  if (loading) {
    return (
      <div className="table-container">
        <div className="loading">Loading submissions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="table-container">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  if (!submissions || submissions.length === 0) {
    return (
      <div className="table-container">
        <div className="no-data">No submissions found</div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <h2>Workflow Submissions</h2>
      <table className="submissions-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Comment</th>
            <th>Created At</th>
            <th>Published Rev</th>
            <th>Requested Rev</th>
            <th>User Email</th>
            <th>Published URL</th>
            <th>Edited URL</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((submission, index) => (
            <tr 
              key={submission.id || index}
              className="table-row clickable"
              onClick={() => handleRowClick(submission)}
            >
              <td title={submission.id}>{submission.id ? submission.id.substring(0, 8) + '...' : 'N/A'}</td>
              <td title={submission.userPayload?.comment}>
                {submission.userPayload?.comment ? 
                  (submission.userPayload.comment.length > 30 ? 
                    submission.userPayload.comment.substring(0, 30) + '...' : 
                    submission.userPayload.comment) : 
                  'N/A'
                }
              </td>
              <td>{submission.createdDate ? new Date(submission.createdDate).toLocaleString() : 'N/A'}</td>
              <td>{submission.siteRevisions?.publishedRevision || submission.revisions?.publishedRevision || 'N/A'}</td>
              <td>{submission.siteRevisions?.requestedRevision || submission.revisions?.requestedRevision || 'N/A'}</td>
              <td>{submission.userData?.user_email || 'N/A'}</td>
              <td>
                {submission.publishedUrl ? (
                  <a href={submission.publishedUrl} target="_blank" rel="noopener noreferrer" 
                     onClick={(e) => e.stopPropagation()} className="url-link">
                    View Published
                  </a>
                ) : 'N/A'}
              </td>
              <td>
                {submission.editedUrl ? (
                  <a href={submission.editedUrl} target="_blank" rel="noopener noreferrer" 
                     onClick={(e) => e.stopPropagation()} className="url-link">
                    View Edited
                  </a>
                ) : 'N/A'}
              </td>
              <td>
                <button 
                  className="action-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRowClick(submission);
                  }}
                  disabled={loadingRowId === submission.id}
                >
                  {loadingRowId === submission.id ? 'Loading Diffs...' : 'Open Details'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SubmissionsTable;
