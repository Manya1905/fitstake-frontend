import React from 'react';
import { usePrivy } from '@privy-io/react-auth';
import FundWallet from './FundWallet';
import FitnessConnect from './FitnessConnect';
import USDCBalance from './USDCBalance';

function ProfileTab({ usdcContract, address, fitnessHook }) {
  const { logout, user } = usePrivy();

  const email = user?.email?.address;
  const truncatedWallet = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';
  const initials = email ? email.split('@')[0].slice(0, 2).toUpperCase() : (address ? address.slice(2, 4).toUpperCase() : '??');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Profile header */}
      <div className="profile-header-row">
        <div className="avatar avatar-lg">{initials}</div>
        <div>
          <p className="profile-name">{email || truncatedWallet}</p>
          <p className="profile-wallet-sm">{truncatedWallet}</p>
        </div>
      </div>

      {/* Wallet section */}
      <div className="card">
        <p className="section-label">Wallet</p>
        <div className="flex-between mb-12">
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Balance</p>
          <USDCBalance usdcContract={usdcContract} address={address} />
        </div>
        <FundWallet address={address} />
      </div>

      {/* Fitness trackers */}
      <div className="card">
        <p className="section-label">Fitness trackers</p>
        <FitnessConnect fitnessHook={fitnessHook} />
      </div>

      {/* Sign out */}
      <button className="btn btn-ghost-pink" onClick={logout}>
        Sign out
      </button>
    </div>
  );
}

export default ProfileTab;
