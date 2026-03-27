import React from 'react';

function BottomNav({ activeTab, onTabChange }) {
  const tabs = [
    {
      id: 'active',
      label: 'Active',
      icon: (active) => (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect x="2" y="2" width="7" height="7" rx="2" stroke={active ? '#e88fa0' : '#b0ada8'} strokeWidth="1.5"/>
          <rect x="11" y="2" width="7" height="7" rx="2" stroke="#b0ada8" strokeWidth="1.5"/>
          <rect x="2" y="11" width="7" height="7" rx="2" stroke="#b0ada8" strokeWidth="1.5"/>
          <rect x="11" y="11" width="7" height="7" rx="2" stroke="#b0ada8" strokeWidth="1.5"/>
        </svg>
      ),
    },
    {
      id: 'explore',
      label: 'Explore',
      icon: (active) => (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="7" stroke={active ? '#e88fa0' : '#b0ada8'} strokeWidth="1.5"/>
          <path d="M10 7v3l2 2" stroke={active ? '#e88fa0' : '#b0ada8'} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      id: 'history',
      label: 'History',
      icon: (active) => (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M4 6h12M4 10h12M4 14h7" stroke={active ? '#e88fa0' : '#b0ada8'} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: (active) => (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="7" r="3" stroke={active ? '#e88fa0' : '#b0ada8'} strokeWidth="1.5"/>
          <path d="M4 17c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke={active ? '#e88fa0' : '#b0ada8'} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="bottom-nav">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className="bnav-item"
            onClick={() => onTabChange(tab.id)}
          >
            <div className="bnav-icon">{tab.icon(isActive)}</div>
            <span className={isActive ? 'bnav-label-on' : 'bnav-label'}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default BottomNav;
