import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { BACKEND_URL, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../utils/constants';

function ProofSubmissionModal({ challenge, onSubmitProof, fitnessHook, onClose, onSubmitted }) {
  const [proofText, setProofText] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState(''); // 'image' or 'video'
  const [fitnessData, setFitnessData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetchingFitness, setFetchingFitness] = useState(false);
  const fileInputRef = useRef(null);

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

  const handleNativeFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
      toast.error('Cloudinary not configured');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const resourceType = file.type.startsWith('video/') ? 'video' : 'image';
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
        { method: 'POST', body: formData }
      );
      const data = await res.json();

      if (data.secure_url) {
        setMediaUrl(data.secure_url);
        setMediaType(data.resource_type);
        toast.success(`${data.resource_type === 'video' ? 'Video' : 'Screenshot'} uploaded!`);
      } else {
        throw new Error(data.error?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed: ' + error.message);
    }
    setUploading(false);
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleMediaUpload = async () => {
    // Use native file picker on all platforms — uploads to Cloudinary via REST API
    fileInputRef.current?.click();
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
          <input
            type="file"
            accept="image/*,video/*"
            ref={fileInputRef}
            onChange={handleNativeFileUpload}
            style={{ display: 'none' }}
          />
          <button
            onClick={handleMediaUpload}
            className="screenshot-btn"
            type="button"
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Screenshot or Video'}
          </button>
          {mediaUrl && (
            <div className="screenshot-preview">
              {mediaType === 'video' ? (
                <video src={mediaUrl} controls playsInline style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 12 }} />
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
