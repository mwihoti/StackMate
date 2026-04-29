'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { connect, disconnect, isConnected, getLocalStorage, getUserData } from '@stacks/connect';
import type { WalletType } from '@/types';

interface WalletContextValue {
  address: string | null;
  walletType: WalletType | null;
  isConnected: boolean;
  isConnecting: boolean;
  isRestoring: boolean;
  connect: (walletType: WalletType) => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextValue>({
  address: null,
  walletType: null,
  isConnected: false,
  isConnecting: false,
  isRestoring: true,
  connect: async () => {},
  disconnect: () => {},
});

function pickStoredAddress(): string | null {
  const storage = getLocalStorage();
  return storage?.addresses?.stx?.[0]?.address ?? null;
}

async function resolveAddress(maxAttempts = 8): Promise<string | null> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const stored = pickStoredAddress();
      if (stored) return stored;

      const userData = await getUserData();
      const addr =
        userData?.profile?.stxAddress?.mainnet ??
        userData?.profile?.stxAddress?.testnet ??
        userData?.profile?.stxAddress?.regtest ??
        userData?.profile?.stxAddress?.devnet ??
        null;
      if (addr) return addr;
    } catch {
      // not ready yet
    }
    await new Promise(r => setTimeout(r, 250));
  }
  return null;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<WalletType | null>(null);
  const [connected, setConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!isConnected()) {
      setIsRestoring(false);
      return;
    }

    resolveAddress().then(addr => {
      if (addr) {
        setAddress(addr);
        setConnected(true);
      } else {
        setConnected(false);
      }
      setIsRestoring(false);
    });
  }, []);

  const connectWallet = useCallback(async (wt: WalletType) => {
    setIsConnecting(true);
    try {
      const result = await connect({
        network: 'mainnet',
        enableLocalStorage: true,
        forceWalletSelect: true,
      });
      // addresses is a flat array mixing STX and BTC entries; find the STX one
      const stxAddr = result.addresses.find(
        a => a.symbol === 'STX' || a.address?.startsWith('SP') || a.address?.startsWith('ST')
      )?.address;
      const addr = stxAddr ?? await resolveAddress();
      setAddress(addr);
      setWalletType(wt);
      setConnected(!!addr);
    } catch {
      // user cancelled
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    disconnect();
    setAddress(null);
    setWalletType(null);
    setConnected(false);
  }, []);

  return (
    <WalletContext.Provider value={{
      address,
      walletType,
      isConnected: connected,
      isConnecting,
      isRestoring,
      connect: connectWallet,
      disconnect: disconnectWallet,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
