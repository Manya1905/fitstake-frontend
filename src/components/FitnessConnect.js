import React from 'react';

function FitnessConnect({ fitnessHook }) {
  const {
    connectedProvider,
    athleteName,
    loading,
    connectStrava,
    connectFitbit,
    disconnect,
  } = fitnessHook;

  if (connectedProvider) {
    return (
      <div>
        <div className="drawer-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              backgroundColor: connectedProvider === 'strava' ? '#fc4c02' : 'var(--color-teal)',
            }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>
              {connectedProvider === 'strava' ? 'Strava' : 'Fitbit'}
            </span>
          </div>
          <span style={{ fontSize: 13, color: 'var(--color-mint)' }}>{athleteName || 'Connected'}</span>
        </div>
        <button onClick={disconnect} className="btn btn-ghost-pink btn-sm" style={{ width: '100%', marginTop: 8 }}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <button
        onClick={connectStrava}
        disabled={loading}
        className="btn btn-cream"
        style={{ width: '100%' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#fc4c02', display: 'inline-block' }} />
          {loading ? 'Connecting...' : 'Connect Strava'}
        </span>
      </button>
      <button
        onClick={connectFitbit}
        disabled={loading}
        className="btn btn-teal"
        style={{ width: '100%' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--color-teal)', display: 'inline-block' }} />
          {loading ? 'Connecting...' : 'Connect Fitbit'}
        </span>
      </button>
    </div>
  );
}

export default FitnessConnect;
