import React, { useState } from 'react';
import './SubmissionsTable.css';
import { approveSubmission } from '../services/api';

// Avatar component for users
const Avatar = ({ name, color = '#3B82F6' }) => {
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??';
  return (
    <div className="avatar" style={{ backgroundColor: color }}>
      {initials}
    </div>
  );
};

// Status badge component
const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    const statusLower = status?.toLowerCase() || '';
    
    if (statusLower.includes('pending') || statusLower.includes('review')) {
      return { className: 'status-pending', text: 'Pending Review' };
    }
    if (statusLower.includes('approved') || statusLower.includes('accept')) {
      return { className: 'status-approved', text: 'Approved' };
    }
    if (statusLower.includes('changes') || statusLower.includes('reject')) {
      return { className: 'status-changes', text: 'Needs Changes' };
    }
    if (statusLower.includes('published') || statusLower.includes('complete')) {
      return { className: 'status-published', text: 'Published' };
    }
    if (statusLower.includes('outdated') || statusLower.includes('old')) {
      return { className: 'status-outdated', text: 'Outdated' };
    }
    return { className: 'status-pending', text: 'Pending Review' };
  };

  const config = getStatusConfig(status);
  return (
    <span className={`status-badge ${config.className}`}>
      {config.text}
    </span>
  );
};

const SubmissionsTable = ({ submissions, onRowClick, loading, error }) => {
  const [loadingRowId, setLoadingRowId] = useState(null);
  const [publishingRowId, setPublishingRowId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

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
      // Wait for diffs to be loaded and get the iframe URL
      const iframeUrl = await onRowClick(params);
      
      // Only open the tab after diffs are successfully loaded
      if (iframeUrl) {
        console.log('Opening iframe page:', iframeUrl);
        window.open(iframeUrl, '_blank');
      }
    } catch (err) {
      console.error('Failed to load diffs for submission', submission.id, err);
      
      let errorMessage = 'Failed to load diffs for this submission.';
      if (err.message && err.message.includes('No diff data available')) {
        errorMessage = 'No diff data available for this submission. The submission may not have any changes to review.';
      } else if (err.message && err.message.includes('HTTP error')) {
        errorMessage = 'Server error while loading diffs. Please check your connection and try again.';
      }
      
      alert(errorMessage);
    } finally {
      // Clear loading state after the operation completes
      setLoadingRowId(null);
    }
  };

  const handlePublishClick = async (event, submission) => {
    event.stopPropagation(); // Prevent row click
    
    setPublishingRowId(submission.id);
    
    try {
      const result = await approveSubmission(submission.id);
      
      console.log('Publish result:', result);
      
      if (result.success || result.message) {
        alert('Successfully published!');
        // Optionally refresh the data here by calling a refresh function
      } else {
        alert('Publish completed, but response was unclear. Please check the submission status.');
      }
    } catch (error) {
      console.error('Publish error:', error);
      alert(`Failed to publish: ${error.message}`);
    } finally {
      setPublishingRowId(null);
    }
  };

  // Filter submissions based on search term
  const filteredSubmissions = submissions.filter(submission => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      submission.url?.toLowerCase().includes(searchLower) ||
      submission.userPayload?.comment?.toLowerCase().includes(searchLower) ||
      submission.id?.toLowerCase().includes(searchLower)
    );
  });

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    const options = { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };
    
    return date.toLocaleDateString('en-US', options);
  };

  // Extract site name from URL
  const getSiteName = (url) => {
    if (!url) return 'Unknown Site';
    
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace('www.', '');
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      
      if (pathParts.length > 0) {
        return `${hostname}/${pathParts[0]}`;
      }
      return hostname;
    } catch {
      return url;
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
    <div className="approvals-container">
      {/* Header Section */}
      <div className="approvals-header">
        <h1 className="approvals-title">Approval requests</h1>
        <div className="header-actions">
          <button 
            className={`filter-button ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 3h12l-5 5v3l-2 2v-5L2 3z"/>
            </svg>
            Filter
          </button>
          <button className="sort-button">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3 6l3 3 3-3H3z"/>
            </svg>
          </button>
          <div className="search-container">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
            </svg>
            <input
              type="text"
              placeholder="Search..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="approvals-table">
          <thead>
            <tr className="table-header">
              <th className="col-site">Site</th>
              <th className="col-revision">
                <span>Revision</span>
                <svg className="info-icon" width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zM7 4a1 1 0 1 1 2 0 1 1 0 0 1-2 0zm1 2a1 1 0 0 1 1 1v4a1 1 0 0 1-2 0V7a1 1 0 0 1 1-1z"/>
                </svg>
              </th>
              <th className="col-status">Status</th>
              <th className="col-date">
                <span>Date sent</span>
                <svg className="sort-arrow" width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1l3 3H5l3-3z"/>
                  <path d="M8 15l3-3H5l3 3z" opacity="0.3"/>
                </svg>
              </th>
              <th className="col-comment">Comment</th>
              <th className="col-sent-by">Sent by</th>
              <th className="col-reviewers">Reviewers</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubmissions.map((submission, index) => {
              const siteName = getSiteName(submission.url);
              const publishedRev = submission.siteRevisions?.publishedRevision || submission.revisions?.publishedRevision;
              const requestedRev = submission.siteRevisions?.requestedRevision || submission.revisions?.requestedRevision;
              
              return (
                <tr 
                  key={submission.id || index}
                  className={`table-row ${loadingRowId === submission.id ? 'loading' : ''}`}
                  onClick={() => handleRowClick(submission)}
                >
                  <td className="col-site">
                    <div className="site-info">
                      <div className="site-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path d="M3 7h18l-2 10H5L3 7z" fill="#E5E7EB"/>
                          <path d="M5 17h14L17 9H7l-2 8z" fill="#60A5FA"/>
                        </svg>
                      </div>
                      <div className="site-details">
                        <div className="site-name">{siteName}</div>
                        <div className="site-url">{submission.url}</div>
                      </div>
                    </div>
                  </td>
                  <td className="col-revision">
                    <span className="revision-number">{requestedRev || 'N/A'}</span>
                  </td>
                  <td className="col-status">
                    <StatusBadge status={submission.status} />
                  </td>
                  <td className="col-date">
                    <span className="date-text">{formatDate(submission.createdDate)}</span>
                  </td>
                  <td className="col-comment">
                    <div className="comment-text">
                      {submission.userPayload?.comment ? (
                        <span title={submission.userPayload.comment}>
                          {submission.userPayload.comment.length > 50 
                            ? submission.userPayload.comment.substring(0, 50) + '...' 
                            : submission.userPayload.comment
                          }
                        </span>
                      ) : (
                        <span className="no-comment">No comment</span>
                      )}
                    </div>
                  </td>
                  <td className="col-sent-by">
                    <Avatar 
                      name={submission.userData?.user_email || 'Unknown User'} 
                      color={index % 2 === 0 ? '#10B981' : '#3B82F6'}
                    />
                  </td>
                  <td className="col-reviewers">
                    <div className="reviewers-list">
                      <Avatar 
                        name="Reviewer 1" 
                        color="#6366F1"
                      />
                      {index === 4 && (
                        <div className="reviewer-count">+5</div>
                      )}
                    </div>
                    <button 
                      className={`publish-button ${publishingRowId === submission.id ? 'loading' : ''}`}
                      onClick={(e) => handlePublishClick(e, submission)}
                      disabled={publishingRowId === submission.id}
                      title="Publish submission"
                    >
                      {publishingRowId === submission.id ? 'Publishing...' : 'Publish'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {filteredSubmissions.length === 0 && !loading && (
          <div className="empty-state">
            <div className="empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M9 11H15M9 15H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H17C18.1046 3 19 3.89543 19 5V19C19 20.1046 18.1046 21 17 21Z" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>No approval requests found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmissionsTable;
