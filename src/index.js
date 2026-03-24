import React from 'react';
import ReactDOM from 'react-dom/client';
import { Buffer } from 'buffer';
import { PrivyProvider } from '@privy-io/react-auth';
import { SmartWalletsProvider } from '@privy-io/react-auth/smart-wallets';
import { Toaster } from 'react-hot-toast';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

window.Buffer = Buffer;

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <PrivyProvider
      appId={process.env.REACT_APP_PRIVY_APP_ID || 'placeholder-app-id'}
      onError={(error) => {
        console.error('Privy error:', error);
        alert('Privy auth error: ' + (error?.message || JSON.stringify(error)));
      }}
      config={{
        loginMethods: ['email'],
        appearance: {
          theme: 'light',
          accentColor: '#b2dfdb',
        },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        externalWallets: {
          coinbaseWallet: { connectionOptions: 'disabled' },
          metamask: { connectionOptions: 'disabled' },
        },
        defaultChain: {
          id: 8453,
          name: 'Base',
          network: 'base',
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
          rpcUrls: {
            default: {
              http: [process.env.REACT_APP_ALCHEMY_BASE_URL || 'https://mainnet.base.org'],
            },
          },
          blockExplorers: {
            default: { name: 'BaseScan', url: 'https://basescan.org' },
          },
          testnet: false,
        },
        supportedChains: [
          {
            id: 8453,
            name: 'Base',
            network: 'base',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: {
              default: {
                http: [process.env.REACT_APP_ALCHEMY_BASE_URL || 'https://mainnet.base.org'],
              },
            },
            blockExplorers: {
              default: { name: 'BaseScan', url: 'https://basescan.org' },
            },
            testnet: false,
          },
        ],
      }}
    >
      <SmartWalletsProvider>
        <App />
      </SmartWalletsProvider>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(255, 255, 255, 0.95)',
            color: '#37474f',
            borderRadius: '15px',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
          },
        }}
      />
    </PrivyProvider>
  </React.StrictMode>
);

serviceWorkerRegistration.register();
