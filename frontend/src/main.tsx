import React from 'react';
import ReactDOM from 'react-dom/client';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectKitProvider } from 'connectkit';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter } from 'react-router-dom';
import { config } from './config/wagmi';
import App from './App';
import './styles/index.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          theme="midnight"
          options={{
            embedGoogleFonts: true,
          }}
        >
          <BrowserRouter>
            <App />
            <Toaster
              position="bottom-right"
              toastOptions={{
                className: 'bg-gray-800 text-white',
                duration: 4000,
              }}
            />
          </BrowserRouter>
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
