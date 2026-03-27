import React from 'react';
import ReactDOM from 'react-dom/client';
import { Buffer } from 'buffer';
import { PrivyProvider } from '@privy-io/react-auth';
import { SmartWalletsProvider } from '@privy-io/react-auth/smart-wallets';
import { Toaster, toast } from 'react-hot-toast';
import './index.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

window.Buffer = Buffer;

if (!process.env.REACT_APP_PRIVY_APP_ID) {
  throw new Error('REACT_APP_PRIVY_APP_ID is not set. Check your .env file.');
}

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <PrivyProvider
      appId={process.env.REACT_APP_PRIVY_APP_ID}
      onError={(error) => {
        console.error('Privy error:', error);
        toast.error('Auth error: ' + (error?.message || 'Unknown error'));
      }}
      config={{
        loginMethods: ['email'],
        appearance: {
          theme: 'light',
          accentColor: '#e88fa0',
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
        position="bottom-center"
        containerStyle={{ bottom: 80 }}
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: "'Trebuchet MS', 'Lucida Sans', sans-serif",
            background: 'rgba(255, 255, 255, 0.97)',
            color: '#2d2b2a',
            borderRadius: '14px',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.12)',
            fontSize: '14px',
          },
        }}
      />
    </PrivyProvider>
  </React.StrictMode>
);

serviceWorkerRegistration.register();
