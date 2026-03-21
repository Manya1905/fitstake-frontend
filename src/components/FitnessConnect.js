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
      <div className="fitness-connected">
        <span className="fitness-status">
          {connectedProvider === 'strava' ? 'Strava' : 'Fitbit'}: {athleteName || 'Connected'}
        </span>
        <button onClick={disconnect} className="fitness-disconnect-btn">
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="fitness-connect">
      <button
        onClick={connectStrava}
        disabled={loading}
        className="fitness-connect-btn strava-btn"
      >
        {loading ? 'Connecting...' : 'Connect Strava'}
      </button>
      <button
        onClick={connectFitbit}
        disabled={loading}
        className="fitness-connect-btn fitbit-btn"
      >
        {loading ? 'Connecting...' : 'Connect Fitbit'}
      </button>
    </div>
  );
}

export default FitnessConnect;
