import React from 'react';

function TransactionOverlay({ message, visible }) {
  if (!visible) return null;

  return (
    <div className="tx-overlay">
      <div className="tx-modal">
        <div className="tx-spinner" />
        <p className="tx-title">{message || 'Processing...'}</p>
        <p className="tx-body">
          Your transaction is being recorded on Base.<br />
          Gas is sponsored — no action needed.
        </p>
        <div className="tx-hint">
          <p>This usually takes 2–5 seconds</p>
        </div>
      </div>
    </div>
  );
}

export default TransactionOverlay;
