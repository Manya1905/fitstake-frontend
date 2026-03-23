import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { keccak256, encodePacked } from 'viem';
import { parseUSDC } from '../utils/constants';

function CreateChallengeForm({ onCreateChallenge, onCreated, onCancel }) {
  const [goal, setGoal] = useState('');
  const [joinDeadline, setJoinDeadline] = useState('');
  const [deadline, setDeadline] = useState('');
  const [stakeAmount, setStakeAmount] = useState('');
  const [proofWindowHours, setProofWindowHours] = useState('24');
  const [voteWindowHours, setVoteWindowHours] = useState('24');
  const [graceHours, setGraceHours] = useState('12');
  const [loading, setLoading] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [inviteCode, setInviteCode] = useState('');

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setInviteCode(code);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!onCreateChallenge) return;

    const stakeInUSDC = parseUSDC(stakeAmount);
    const joinDeadlineTs = Math.floor(new Date(joinDeadline).getTime() / 1000);
    const deadlineTs = Math.floor(new Date(deadline).getTime() / 1000);

    if (joinDeadlineTs <= Math.floor(Date.now() / 1000)) {
      toast.error('Join deadline must be in the future');
      return;
    }
    if (deadlineTs <= joinDeadlineTs) {
      toast.error('Activity deadline must be after join deadline');
      return;
    }

    // Hash invite code if provided
    const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';
    let inviteCodeHash = ZERO_BYTES32;
    if (isPrivate && inviteCode.trim()) {
      inviteCodeHash = keccak256(encodePacked(['string'], [inviteCode.trim()]));
    }

    try {
      setLoading(true);
      toast.loading('Creating challenge...', { id: 'create' });

      await onCreateChallenge(
        stakeInUSDC,
        goal,
        joinDeadlineTs,
        deadlineTs,
        parseInt(proofWindowHours),
        parseInt(voteWindowHours),
        parseInt(graceHours),
        isPrivate,
        inviteCodeHash
      );

      toast.success('Challenge created!', { id: 'create' });
      onCreated(isPrivate && inviteCode.trim() ? inviteCode.trim() : null);
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast.error('Failed: ' + (error.reason || error.message), { id: 'create' });
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="create-form">
      <h3>Create New Challenge</h3>

      <div className="form-group">
        <label>Fitness Goal</label>
        <input
          type="text"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="e.g., Run 5K in under 30 minutes"
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Join Deadline</label>
          <input
            type="datetime-local"
            value={joinDeadline}
            onChange={(e) => setJoinDeadline(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Activity Deadline</label>
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label>Stake Amount (USDC)</label>
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={stakeAmount}
          onChange={(e) => setStakeAmount(e.target.value)}
          placeholder="10.00"
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Proof Window (hours)</label>
          <input
            type="number"
            min="1"
            value={proofWindowHours}
            onChange={(e) => setProofWindowHours(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Vote Window (hours)</label>
          <input
            type="number"
            min="1"
            value={voteWindowHours}
            onChange={(e) => setVoteWindowHours(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Grace Period (hours)</label>
          <input
            type="number"
            min="0"
            value={graceHours}
            onChange={(e) => setGraceHours(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="form-group private-toggle">
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
          />
          <span>Make this a private challenge</span>
        </label>
      </div>

      {isPrivate && (
        <div className="form-group invite-code-group">
          <label>Invite Code (optional)</label>
          <div className="invite-code-row">
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="e.g., ABC12345"
            />
            <button type="button" onClick={generateCode} className="generate-code-btn">
              Generate
            </button>
          </div>
          <p className="form-hint">
            Share this code with friends so they can join directly. Without a code, you'll need to approve each join request.
          </p>
        </div>
      )}

      <div className="form-buttons">
        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? 'Creating Challenge...' : 'Create Challenge'}
        </button>
        <button type="button" onClick={onCancel} className="cancel-btn">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default CreateChallengeForm;
