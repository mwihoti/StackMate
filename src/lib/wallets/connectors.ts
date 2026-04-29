import type { WalletType } from '@/types';

export const WALLET_OPTIONS: { id: WalletType; name: string; description: string }[] = [
  { id: 'leather', name: 'Leather', description: 'Native Stacks wallet' },
  { id: 'xverse', name: 'Xverse', description: 'Native Stacks wallet' },
  { id: 'metamask', name: 'MetaMask', description: 'Via Stacks Snap' },
  { id: 'asigna', name: 'Asigna Multisig', description: 'For teams & DAOs' },
  { id: 'fordefi', name: 'Fordefi', description: 'Institutional MPC wallet' },
];
