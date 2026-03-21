import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useCloudinary } from '../hooks/useCloudinary';
import { BACKEND_URL } from '../utils/constants';

function ProofSubmissionModal({ challenge, onSubmitProof, fitnessHook, onClose, onSubmitted }) {
  const [proofText, setProofText] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState(''); // 'image' or 'video'
  const [fitnessData, setFitnessData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingFitness, setFetchingFitness] = useState(false);
  const { upload, isConfigured } = useCloudinary();

  // Fetch fitness data when modal opens
  useEffect(() => {
    if (fitnessHook && fitnessHook.connectedProvider && challenge) {
      const fetchData = async () => {
        setFetchingFitness(true);
        const startDate = new Date(challenge.joinDeadline * 1000).toISOString().split('T')[0];
        const endDate = new Date(challenge.deadline * 1000).toISOString().split('T')[0];

        try {
          const provider = fitnessHook.connectedProvider;
          const tokens = fitnessHook.getTokens(provider);
          if (!tokens) {
            setFetchingFitness(false);
            return;
          }

          const params = new URLSearchParams({
            provider,
            accessToken: tokens.accessToken,
            startDate,
            endDate,
          });

          const res = await fetch(`${BACKEND_URL}/api/fitness/activities?${params}`);
          const data = await res.json();
          if (data.activities) {
            setFitnessData(data.activities);
          }
        } catch (error) {
          console.error('Error fetching fitness data:', error);
        }
        setFetchingFitness(false);
      };
      fetchData();
    }
  }, [fitnessHook, challenge]);

  const handleMediaUpload = async () => {
    if (isConfigured) {
      try {
        const result = await upload('auto');
        setMediaUrl(result.url);
        setMediaType(result.type);
        toast.success(`${result.type === 'video' ? 'Video' : 'Screenshot'} uploaded!`);
      } catch (error) {
        console.error('Upload error:', error);
        toast.error('Upload failed: ' + error.message);
      }
    } else {
      const url = window.prompt('Enter image/video URL:');
      if (url) {
        setMediaUrl(url);
        setMediaType(url.match(/\.(mp4|mov|webm)$/i) ? 'video' : 'image');
      }
    }
  };

  const handleSubmit = async () => {
    if (!onSubmitProof) return;

    try {
      setLoading(true);
      toast.loading('Submitting proof...', { id: 'proof' });

      const proofData = JSON.stringify({
        text: proofText,
        media: mediaUrl || undefined,
        mediaType: mediaType || undefined,
        fitness: fitnessData || undefined,
        timestamp: Date.now(),
      });

      await onSubmitProof(challenge.id, proofData);

      toast.success('Proof submitted!', { id: 'proof' });
      onSubmitted();
    } catch (error) {
      console.error('Error submitting proof:', error);
      toast.error('Failed: ' + (error.reason || error.message), { id: 'proof' });
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Submit Proof</h3>
        <p className="modal-subtitle">Challenge: {challenge.goal}</p>

        {/* Fitness App Data */}
        {fitnessHook && fitnessHook.connectedProvider && (
          <div className="fitness-data-section">
            <h4>Fitness App Data ({fitnessHook.connectedProvider})</h4>
            {fetchingFitness ? (
              <p>Fetching workout data...</p>
            ) : fitnessData && fitnessData.length > 0 ? (
              <div className="fitness-summary">
                {fitnessData.map((activity, i) => (
                  <div key={i} className="fitness-activity">
                    <p><strong>{activity.name || activity.type || 'Workout'}</strong></p>
                    {activity.duration && <p>Duration: {Math.round(activity.duration / 60)} min</p>}
                    {activity.distance && <p>Distance: {(activity.distance / 1000).toFixed(2)} km</p>}
                    {activity.calories && <p>Calories: {activity.calories}</p>}
                    {activity.date && <p>Date: {new Date(activity.date).toLocaleDateString()}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="fitness-empty">No workout data found for this period.</p>
            )}
          </div>
        )}

        {/* Manual proof text */}
        <div className="form-group">
          <label>Proof Description</label>
          <textarea
            value={proofText}
            onChange={(e) => setProofText(e.target.value)}
            placeholder="Describe your workout — what you did, how it went, etc."
            rows="4"
          />
        </div>

        {/* Media upload (screenshot or video) */}
        <div className="screenshot-section">
          <button
            onClick={handleMediaUpload}
            className="screenshot-btn"
            type="button"
          >
            Upload Screenshot or Video
          </button>
          {mediaUrl && (
            <div className="screenshot-preview">
              {mediaType === 'video' ? (
                <video src={mediaUrl} controls style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 12 }} />
              ) : (
                <img src={mediaUrl} alt="Proof" />
              )}
            </div>
          )}
        </div>

        <div className="modal-buttons">
          <button
            onClick={handleSubmit}
            className="submit-btn"
            disabled={loading || (!proofText && !fitnessData && !mediaUrl)}
          >
            {loading ? 'Submitting...' : 'Submit Proof'}
          </button>
          <button onClick={onClose} className="cancel-btn">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProofSubmissionModal;
