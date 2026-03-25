import React, { useState } from 'react';
import toast from 'react-hot-toast';
function JoinRequestsSection({ challenge, joinRequests, emailMap = {}, onApprove, onReject }) {
  const [processing, setProcessing] = useState(null);
  const joinDeadlinePassed = Math.floor(Date.now() / 1000) > challenge.joinDeadline;

  const handleApprove = async (addr) => {
    setProcessing(addr);
    try {
      toast.loading('Approving...', { id: 'approve' });
      await onApprove(challenge.id, addr);
      toast.success('Approved!', { id: 'approve' });
    } catch (error) {
      toast.error('Failed: ' + (error.reason || error.message), { id: 'approve' });
    }
    setProcessing(null);
  };

  const handleReject = async (addr) => {
    setProcessing(addr);
    try {
      toast.loading('Rejecting...', { id: 'reject' });
      await onReject(challenge.id, addr);
      toast.success('Rejected', { id: 'reject' });
    } catch (error) {
      toast.error('Failed: ' + (error.reason || error.message), { id: 'reject' });
    }
    setProcessing(null);
  };

  if (!joinRequests || joinRequests.length === 0) {
    return (
      <div className="join-requests-section">
        <h4>Join Requests</h4>
        <p className="no-requests">No pending requests</p>
      </div>
    );
  }

  return (
    <div className="join-requests-section">
      <h4>Join Requests {joinDeadlinePassed && <span className="deadline-passed-label">(Join window closed)</span>}</h4>
      {joinRequests.map((addr) => (
        <div key={addr} className={`request-item ${joinDeadlinePassed ? 'request-expired' : ''}`}>
          <span className="request-address">
            {emailMap[addr.toLowerCase()] || `${addr.slice(0, 6)}...${addr.slice(-4)}`}
          </span>
          <div className="request-actions">
            <button
              onClick={() => handleApprove(addr)}
              disabled={processing === addr || joinDeadlinePassed}
              className="approve-btn"
            >
              Approve
            </button>
            <button
              onClick={() => handleReject(addr)}
              disabled={processing === addr || joinDeadlinePassed}
              className="reject-btn"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default JoinRequestsSection;
