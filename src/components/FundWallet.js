import React from 'react';

function FundWallet({ address }) {
  if (!address) return null;

  // Link to Circle faucet for testnet USDC
  const faucetUrl = 'https://faucet.circle.com/';

  return (
    <div className="fund-wallet">
      <a
        href={faucetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="fund-btn"
      >
        Get Testnet USDC
      </a>
      <p className="fund-hint">
        Copy your wallet address: <code>{address}</code>
      </p>
    </div>
  );
}

export default FundWallet;
