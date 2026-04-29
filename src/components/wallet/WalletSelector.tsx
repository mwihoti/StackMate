'use client';

import { WALLET_OPTIONS } from '@/lib/wallets/connectors';
import type { WalletType } from '@/types';

interface Props {
  connect: (walletType: WalletType) => Promise<void>;
  onClose: () => void;
}

export function WalletSelector({ connect, onClose }: Props) {
  async function handleConnect(walletType: WalletType) {
    await connect(walletType);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm mx-4">
        <h2 className="text-white text-xl font-bold mb-1">Connect Wallet</h2>
        <p className="text-gray-400 text-sm mb-6">Choose your wallet to continue</p>
        <div className="space-y-3">
          {WALLET_OPTIONS.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => handleConnect(wallet.id)}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-orange-500 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 font-bold text-sm">
                {wallet.name[0]}
              </div>
              <div className="text-left">
                <div className="text-white font-medium">{wallet.name}</div>
                <div className="text-gray-400 text-xs">{wallet.description}</div>
              </div>
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full text-gray-400 hover:text-white text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
