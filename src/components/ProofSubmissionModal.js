import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { BACKEND_URL, CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../utils/constants';

const MAX_MEDIA = 3;
const MAX_CAPTION = 500;

function ProofSubmissionModal({ challenge, onSubmitProof, fitnessHook, onClose, onSubmitted }) {
  const [proofText, setProofText] = useState('');
  const [mediaFiles, setMediaFiles] = useState([]); // [{ url, type }]
  const [fitnessData, setFitnessData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetchingFitness, setFetchingFitness] = useState(false);
  const fileInputRef = useRef(null);

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

    if (mediaFiles.length >= MAX_MEDIA) {
      toast.error(`Maximum ${MAX_MEDIA} files allowed`);
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
        setMediaFiles((prev) => [...prev, { url: data.secure_url, type: data.resource_type }]);
        toast.success(`${data.resource_type === 'video' ? 'Video' : 'Screenshot'} uploaded! (${mediaFiles.length + 1}/${MAX_MEDIA})`);
      } else {
        throw new Error(data.error?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed: ' + error.message);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleMediaUpload = () => {
    fileInputRef.current?.click();
  };

  const removeMedia = (index) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!onSubmitProof) return;

    try {
      setLoading(true);
      toast.loading('Submitting proof...', { id: 'proof' });

      const proofData = JSON.stringify({
        text: proofText,
        media: mediaFiles.length > 0 ? mediaFiles : undefined,
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

  const proofDueDate = challenge.proofDeadline
    ? new Date(challenge.proofDeadline * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : null;

  const canSubmit = !loading && (proofText || fitnessData || mediaFiles.length > 0);

  return (
    <div className="proof-submission-screen">
      {/* Nav bar */}
      <div className="nav">
        <button className="btn-back" onClick={onClose}>&larr; Cancel</button>
        <span className="nav-title">Submit proof</span>
        <div style={{ width: 60 }} />
      </div>

      <div className="proof-submission-body">
        {/* Challenge info header */}
        <div style={{ marginBottom: 18 }}>
          <h2 className="create-form-heading" style={{ marginBottom: 4 }}>{challenge.goal}</h2>
          {proofDueDate && (
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Proof due {proofDueDate}</p>
          )}
        </div>

        {/* Media upload grid — 3 slots */}
        <input
          type="file"
          accept="image/*,video/*"
          ref={fileInputRef}
          onChange={handleNativeFileUpload}
          style={{ display: 'none' }}
        />
        <div className="media-upload-grid">
          {[0, 1, 2].map((index) => {
            const file = mediaFiles[index];
            if (file) {
              return (
                <div key={index} className="media-slot media-slot-filled">
                  {file.type === 'video' ? (
                    <video src={file.url} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
                  ) : (
                    <img src={file.url} alt={`Proof ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} />
                  )}
                  <button
                    className="media-slot-remove"
                    onClick={(e) => { e.stopPropagation(); removeMedia(index); }}
                    type="button"
                  >
                    &times;
                  </button>
                </div>
              );
            }
            return (
              <div
                key={index}
                className="media-slot"
                onClick={index === mediaFiles.length ? handleMediaUpload : undefined}
                style={{ cursor: index === mediaFiles.length ? 'pointer' : 'default', opacity: index > mediaFiles.length ? 0.4 : 1 }}
              >
                {uploading && index === mediaFiles.length ? (
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Uploading...</span>
                ) : index === mediaFiles.length ? (
                  <>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5v14M5 12h14" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Add photo</span>
                  </>
                ) : (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{index + 1}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Fitness data card */}
        {fitnessHook && fitnessHook.connectedProvider && (
          <div className="fitness-data-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                backgroundColor: fitnessHook.connectedProvider === 'strava' ? '#fc4c02' : 'var(--color-teal)',
              }} />
              <strong style={{ fontSize: 13 }}>{fitnessHook.connectedProvider === 'strava' ? 'Strava' : 'Fitbit'} data</strong>
            </div>
            {fetchingFitness ? (
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Fetching workout data...</p>
            ) : fitnessData && fitnessData.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {fitnessData.map((activity, i) => (
                  <div key={i} style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    <strong>{activity.name || activity.type || 'Workout'}</strong>
                    {activity.duration && <span> &middot; {Math.round(activity.duration / 60)} min</span>}
                    {activity.distance && <span> &middot; {(activity.distance / 1000).toFixed(2)} km</span>}
                    {activity.calories && <span> &middot; {activity.calories} cal</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No workout data found for this period.</p>
            )}
          </div>
        )}

        {/* Caption */}
        <div className="form-group">
          <label className="form-label">Caption</label>
          <textarea
            className="form-textarea"
            value={proofText}
            onChange={(e) => setProofText(e.target.value.slice(0, MAX_CAPTION))}
            placeholder="Describe your workout &mdash; what you did, how it went..."
            rows="4"
          />
          <span style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'right', display: 'block', marginTop: 4 }}>
            {proofText.length}/{MAX_CAPTION}
          </span>
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          className="btn btn-pink"
          style={{ width: '100%', marginTop: 8 }}
          disabled={!canSubmit}
        >
          {loading ? 'Submitting...' : 'Submit proof'}
        </button>
      </div>
    </div>
  );
}

export default ProofSubmissionModal;
