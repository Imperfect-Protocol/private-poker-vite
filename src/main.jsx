// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import Web3Provider from '@/components/Web3Provider.jsx'
import { BLSProvider } from '@/contexts/BLSContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Web3Provider>
      <BLSProvider>
        <App />
      </BLSProvider>
    </Web3Provider>
  </React.StrictMode>,
)