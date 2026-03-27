import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { getAvatarColor, getInitials } from '../utils/avatarColor';

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

  return (
    <div style={{ marginBottom: 14 }}>
      <p className="section-label">
        Join Requests
        {joinDeadlinePassed && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>(closed)</span>}
      </p>

      {(!joinRequests || joinRequests.length === 0) ? (
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No pending requests</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {joinRequests.map((addr) => {
            const email = emailMap[addr.toLowerCase()];
            const display = email || `${addr.slice(0, 6)}...${addr.slice(-4)}`;
            return (
              <div key={addr} className="join-request-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                  <div
                    className="avatar"
                    style={{ backgroundColor: getAvatarColor(addr), width: 32, height: 32, fontSize: 11, flexShrink: 0 }}
                  >
                    {getInitials(addr, email)}
                  </div>
                  <span style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {display}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => handleApprove(addr)}
                    disabled={processing === addr || joinDeadlinePassed}
                    className="btn btn-teal btn-sm"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(addr)}
                    disabled={processing === addr || joinDeadlinePassed}
                    className="btn btn-danger btn-sm"
                  >
                    Decline
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default JoinRequestsSection;
