import React from 'react';
import { usePrivy } from '@privy-io/react-auth';
import USDCBalance from './USDCBalance';
import FitnessConnect from './FitnessConnect';

function Header({ usdcContract, address, fitnessHook, onOpenProfile }) {
  const { login, logout, ready, authenticated, user } = usePrivy();

  const displayAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  const displayName = user?.email?.address || user?.google?.email || displayAddress;

  return (
    <header className="App-header">
      <h1>FitStake</h1>
      <p>Bet on yourself. Win money for hitting your fitness goals.</p>

      {!ready ? (
        <p>Loading...</p>
      ) : !authenticated ? (
        <button onClick={login} className="connect-btn">
          Sign In
        </button>
      ) : (
        <div className="header-info">
          <div className="header-buttons">
            <div
              className="account-info account-info-clickable"
              onClick={onOpenProfile}
              title="View profile"
            >
              {displayName}
            </div>
            {address && <USDCBalance usdcContract={usdcContract} address={address} />}
            <FitnessConnect fitnessHook={fitnessHook} />
            <button onClick={logout} className="connect-btn disconnect-btn">
              Sign Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
