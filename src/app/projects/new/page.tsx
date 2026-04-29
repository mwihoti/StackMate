'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/useWallet';
import { TxStatus } from '@/components/ui/TxStatus';
import { openContractCall } from '@stacks/connect';
import { stringAsciiCV } from '@stacks/transactions';
import { STACKS_MAINNET } from '@stacks/network';
import type { ProjectCategory, PartnerRole, CommitmentLevel, CompensationType } from '@/types';

const CATEGORIES: ProjectCategory[] = [
  'DeFi', 'Gaming & Interactive', 'AI & Agents', 'Fintech & Payments',
  'Commerce & Marketplaces', 'Developer Tools & Infrastructure', 'Education', 'Consumer Apps', 'Other',
];
const ROLES: PartnerRole[] = [
  'Frontend Developer', 'Backend Developer', 'Smart Contract Developer', 'Blockchain Developer',
  'UI/UX Designer', 'Product Manager', 'Marketing', 'Community Manager', 'Other',
];

export default function NewProjectPage() {
  const { address, isConnected, isRestoring } = useWallet();
  const router = useRouter();

  const [form, setForm] = useState({
    name: '', category: 'DeFi' as ProjectCategory,
    description: '', website: '', github: '',
    role: 'Frontend Developer' as PartnerRole,
    skills: '', commitment: 'part-time' as CommitmentLevel,
    compensation: 'equity' as CompensationType, roleDescription: '',
  });
  const [txId, setTxId] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');
  const [loading, setLoading] = useState(false);

  function set(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isConnected || !address) return;
    setLoading(true);

    const projectId = crypto.randomUUID();

    openContractCall({
      contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? '',
      contractName: 'project-registry',
      functionName: 'register-project',
      functionArgs: [stringAsciiCV(projectId)],
      network: STACKS_MAINNET,
      onFinish: async (data) => {
        setTxId(data.txId);
        setTxStatus('pending');

        // Save off-chain details
        await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project: {
              id: projectId,
              owner_address: address,
              name: form.name,
              category: form.category,
              description: form.description,
              website: form.website,
              github: form.github,
              team_members: [{ address, role: 'Owner' }],
              tx_id: data.txId,
            },
            request: {
              role: form.role,
              skills: form.skills.split(',').map((s: string) => s.trim()).filter(Boolean),
              commitment: form.commitment,
              compensation: form.compensation,
              description: form.roleDescription,
              tx_id: data.txId,
            },
          }),
        });

        // Poll tx
        const interval = setInterval(async () => {
          const res = await fetch(`https://api.hiro.so/extended/v1/tx/${data.txId}`);
          const tx = await res.json();
          if (tx.tx_status === 'success') {
            clearInterval(interval);
            setTxStatus('success');
            setTimeout(() => router.push(`/projects/${projectId}`), 1500);
          } else if (tx.tx_status === 'abort_by_response') {
            clearInterval(interval);
            setTxStatus('failed');
          }
        }, 3000);

        setLoading(false);
      },
      onCancel: () => setLoading(false),
    });
  }

  if (isRestoring) {
    return <div className="max-w-lg mx-auto text-center py-20 text-gray-400">Restoring wallet session...</div>;
  }

  if (!isConnected) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <h2 className="text-white text-xl font-semibold mb-2">Connect your wallet first</h2>
        <p className="text-gray-400">You need a wallet connected to post a project.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-1">Post your project</h1>
      <p className="text-gray-400 mb-8">Find your ideal builder partner on Stacks</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="bg-[#3c4f70] border border-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold">Project Details</h2>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Project Name</label>
            <input required value={form.name} onChange={e => set('name', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500" />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Category</label>
            <select value={form.category} onChange={e => set('category', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Description</label>
            <textarea required value={form.description} onChange={e => set('description', e.target.value)}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Website</label>
              <input value={form.website} onChange={e => set('website', e.target.value)}
                placeholder="https://"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">GitHub</label>
              <input value={form.github} onChange={e => set('github', e.target.value)}
                placeholder="https://github.com/..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500" />
            </div>
          </div>
        </section>

        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-semibold">Partner Request</h2>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Role Needed</label>
            <select value={form.role} onChange={e => set('role', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500">
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Required Skills (comma separated)</label>
            <input value={form.skills} onChange={e => set('skills', e.target.value)}
              placeholder="e.g. Clarity, React, DeFi"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Commitment</label>
              <select value={form.commitment} onChange={e => set('commitment', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500">
                <option value="part-time">Part-time</option>
                <option value="full-time">Full-time</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Compensation</label>
              <select value={form.compensation} onChange={e => set('compensation', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500">
                <option value="equity">Equity</option>
                <option value="bounty">Bounty</option>
                <option value="volunteer">Volunteer</option>
                <option value="salary">Salary</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Role Description</label>
            <textarea value={form.roleDescription} onChange={e => set('roleDescription', e.target.value)}
              rows={3} placeholder="What will this person work on?"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 resize-none" />
          </div>
        </section>

        <TxStatus txId={txId} status={txStatus} />

        <button
          type="submit"
          disabled={loading || txStatus === 'pending'}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {loading ? 'Opening wallet...' : txStatus === 'pending' ? 'Waiting for confirmation...' : 'Post Project & Sign Transaction'}
        </button>
      </form>
    </div>
  );
}
