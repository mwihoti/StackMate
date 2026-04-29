'use client';

import { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';

export function WalletButton() {
  const { address, isConnected, isConnecting, connect, disconnect } = useWallet();
  const [copied, setCopied] = useState(false);

  const short = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;

  function copyAddress() {
    if (!address) return;
    navigator.clipboard.writeText(address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={copyAddress}
          title={copied ? 'Copied!' : 'Click to copy address'}
          className="text-sm text-gray-300 bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg font-mono transition-colors"
        >
          {copied ? 'Copied!' : short}
        </button>
        <button
          onClick={disconnect}
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => connect('leather')}
      disabled={isConnecting}
      className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-xl transition-colors text-sm"
    >
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}
