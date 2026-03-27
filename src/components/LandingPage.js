import React from 'react';

function LandingPage({ onSignIn }) {
  return (
    <div>
      <div className="nav">
        <div className="wordmark">
          <span className="fit">Fit</span>
          <span className="stake">Stake</span>
        </div>
        <button
          className="btn btn-teal btn-sm"
          style={{ width: 'auto', padding: '6px 16px' }}
          onClick={onSignIn}
        >
          Sign in
        </button>
      </div>

      <div className="landing-hero">
        <p className="landing-title">
          Bet on yourself.<br />Win money doing it.
        </p>
        <p className="landing-subtitle">
          Stake money on your fitness goals. Submit proof. Let the community vote. Win the pot.
        </p>
        <button className="btn btn-pink mb-24" onClick={onSignIn}>
          Get started — it's free
        </button>

        <div className="how-it-works-grid">
          <div className="card how-card">
            <div className="how-card-icon" style={{ background: 'var(--color-pink-bg)' }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--color-pink)' }} />
            </div>
            <p className="how-card-title">Stake USDC</p>
            <p className="how-card-body">Put money on the line</p>
          </div>
          <div className="card how-card">
            <div className="how-card-icon" style={{ background: 'var(--color-cream-bg)' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--color-cream)' }} />
            </div>
            <p className="how-card-title">Prove it</p>
            <p className="how-card-body">Upload your activity</p>
          </div>
          <div className="card how-card">
            <div className="how-card-icon" style={{ background: 'var(--color-lavender-bg)' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--color-lavender)' }} />
            </div>
            <p className="how-card-title">Community votes</p>
            <p className="how-card-body">Get verified by peers</p>
          </div>
          <div className="card how-card">
            <div className="how-card-icon" style={{ background: 'var(--color-mint-bg)' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--color-mint)' }} />
            </div>
            <p className="how-card-title">Win the pot</p>
            <p className="how-card-body">Take home the stakes</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
