import React, { useState } from 'react';

function OnboardingSlides({ address, fitnessHook, onComplete }) {
  const [slide, setSlide] = useState(0);

  const handleNext = () => {
    if (slide < 2) {
      setSlide(slide + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    localStorage.setItem('fitstake_onboarded', 'true');
    onComplete();
  };

  const truncatedAddress = address
    ? `${address.slice(0, 20)}\n${address.slice(20)}`
    : '';

  const copyAddress = () => {
    if (address) navigator.clipboard.writeText(address);
  };

  return (
    <div>
      <div className="slide-center">
        <div className="wordmark mb-24">
          <span className="fit">Fit</span>
          <span className="stake">Stake</span>
        </div>

        {/* Slide 1: How it works */}
        {slide === 0 && (
          <>
            <p className="slide-title">Here's how it works</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginBottom: 28 }}>
              <div className="step-row">
                <div className="step-dot" style={{ background: 'var(--color-pink-bg)', color: 'var(--color-pink)' }}>1</div>
                <div style={{ textAlign: 'left' }}>
                  <p className="step-title">Stake USDC</p>
                  <p className="step-body">Join a challenge and put money on the line</p>
                </div>
              </div>
              <div className="step-row">
                <div className="step-dot" style={{ background: 'var(--color-cream-bg)', color: 'var(--color-cream)' }}>2</div>
                <div style={{ textAlign: 'left' }}>
                  <p className="step-title">Complete & prove it</p>
                  <p className="step-body">Do the activity and submit your proof</p>
                </div>
              </div>
              <div className="step-row">
                <div className="step-dot" style={{ background: 'var(--color-lavender-bg)', color: 'var(--color-lavender)' }}>3</div>
                <div style={{ textAlign: 'left' }}>
                  <p className="step-title">Community votes</p>
                  <p className="step-body">Participants verify each other's proofs</p>
                </div>
              </div>
              <div className="step-row">
                <div className="step-dot" style={{ background: 'var(--color-mint-bg)', color: 'var(--color-mint)' }}>4</div>
                <div style={{ textAlign: 'left' }}>
                  <p className="step-title">Win the pot</p>
                  <p className="step-body">Verified completers split the stakes</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Slide 2: Connect tracker */}
        {slide === 1 && (
          <>
            <div className="slide-icon" style={{ background: 'var(--color-mint-bg)' }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect x="8" y="6" width="16" height="20" rx="4" stroke="#7ecda0" strokeWidth="2"/>
                <path d="M12 16l3 3 5-5" stroke="#7ecda0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="slide-title">How will you prove it?</p>
            <p className="slide-body">Connect a tracker for automatic verification, or upload photos from your camera roll.</p>

            <button
              className="neutral-btn"
              onClick={() => fitnessHook && fitnessHook.connectStrava()}
            >
              <div className="tracker-dot" style={{ background: '#fc4c02' }} />
              Connect Strava
            </button>
            <button
              className="neutral-btn"
              onClick={() => fitnessHook && fitnessHook.connectFitbit()}
            >
              <div className="tracker-dot" style={{ background: '#00b0b9' }} />
              Connect Fitbit
            </button>

            <div className="divider">
              <div className="divider-line" />
              <span className="divider-text">or</span>
              <div className="divider-line" />
            </div>

            <button className="neutral-btn mb-22">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="3" width="14" height="10" rx="2" stroke="#7a7873" strokeWidth="1.2"/>
                <circle cx="8" cy="8" r="2.5" stroke="#7a7873" strokeWidth="1.2"/>
                <path d="M5 3l1-2h4l1 2" stroke="#7a7873" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              I'll upload from my camera roll
            </button>
          </>
        )}

        {/* Slide 3: Add USDC */}
        {slide === 2 && (
          <>
            <div className="slide-icon" style={{ background: 'var(--color-lavender-bg)' }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="10" stroke="#b8a9e0" strokeWidth="2"/>
                <text x="16" y="21" textAnchor="middle" fontSize="12" fontWeight="600" fill="#b8a9e0">$</text>
              </svg>
            </div>
            <p className="slide-title">Add USDC to get started</p>
            <p className="slide-body">You'll need USDC on Base to join challenges. Buy with a card or send to your wallet.</p>

            {address && (
              <div className="card mb-22" style={{ width: '100%', textAlign: 'left' }}>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>Your wallet address</p>
                <p className="wallet-address">{truncatedAddress}</p>
                <button
                  className="btn btn-neutral btn-sm mt-10"
                  onClick={copyAddress}
                >
                  Copy address
                </button>
              </div>
            )}
          </>
        )}

        {/* Dots */}
        <div className="dots">
          {[0, 1, 2].map((i) => (
            <div key={i} className={slide === i ? 'dot-on' : 'dot-off'} />
          ))}
        </div>

        {/* Buttons */}
        {slide < 2 ? (
          <>
            <button className="btn btn-pink mb-12" onClick={handleNext}>Next</button>
            <button className="skip-btn" onClick={handleFinish}>Skip intro</button>
          </>
        ) : (
          <>
            <button className="btn btn-mint mb-12" onClick={handleFinish}>Go to my dashboard</button>
            <button className="skip-btn" onClick={handleFinish}>I'll add funds later</button>
          </>
        )}
      </div>
    </div>
  );
}

export default OnboardingSlides;
