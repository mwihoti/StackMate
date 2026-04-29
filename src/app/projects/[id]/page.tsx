'use client';

import { useState } from 'react';
import { use } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useProject } from '@/hooks/useProjects';
import { useApplications } from '@/hooks/useApplications';
import { TxStatus } from '@/components/ui/TxStatus';
import { openContractCall } from '@stacks/connect';
import { stringAsciiCV, boolCV, principalCV } from '@stacks/transactions';
import { STACKS_MAINNET } from '@stacks/network';

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { project, partnerRequest, loading, refetch } = useProject(id);
  const { applications } = useApplications(id);
  const { address, isConnected, connect } = useWallet();

  const [pitch, setPitch] = useState('');
  const [links, setLinks] = useState('');
  const [txId, setTxId] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');
  const [submitting, setSubmitting] = useState(false);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ description: '', website: '', github: '' });
  const [saving, setSaving] = useState(false);

  const isOwner = !!(address && project?.owner_address === address);
  const hasApplied = applications.some(a => a.applicant_address === address);

  function startEdit() {
    setEditForm({
      description: project?.description ?? '',
      website: project?.website ?? '',
      github: project?.github ?? '',
    });
    setEditing(true);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!address || !project) return;
    setSaving(true);
    await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editForm, owner_address: address }),
    });
    setSaving(false);
    setEditing(false);
    refetch?.();
  }

  async function handleToggleOpen() {
    if (!address || !project) return;
    const newStatus = !project.looking_for_partner;
    openContractCall({
      contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? '',
      contractName: 'project-registry',
      functionName: 'set-looking-for-partner',
      functionArgs: [stringAsciiCV(id), boolCV(newStatus)],
      network: STACKS_MAINNET,
      onFinish: async (data) => {
        await fetch(`/api/projects/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ looking_for_partner: newStatus, owner_address: address }),
        });
        refetch?.();
      },
      onCancel: () => {},
    });
  }

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!isConnected || !address) return;
    setSubmitting(true);
    openContractCall({
      contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? '',
      contractName: 'applications',
      functionName: 'apply',
      functionArgs: [stringAsciiCV(id)],
      network: STACKS_MAINNET,
      onFinish: async (data) => {
        setTxId(data.txId);
        setTxStatus('pending');
        await fetch('/api/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'apply',
            project_id: id,
            applicant_address: address,
            pitch,
            links: links.split(',').map((l: string) => l.trim()).filter(Boolean),
            tx_id: data.txId,
          }),
        });
        const interval = setInterval(async () => {
          const res = await fetch(`https://api.hiro.so/extended/v1/tx/${data.txId}`);
          const tx = await res.json();
          if (tx.tx_status === 'success') { clearInterval(interval); setTxStatus('success'); }
          else if (tx.tx_status === 'abort_by_response') { clearInterval(interval); setTxStatus('failed'); }
        }, 3000);
        setSubmitting(false);
      },
      onCancel: () => setSubmitting(false),
    });
  }

  async function handleAccept(applicantAddress: string) {
    openContractCall({
      contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? '',
      contractName: 'partnerships',
      functionName: 'accept-partner',
      functionArgs: [stringAsciiCV(id), principalCV(applicantAddress)],
      network: STACKS_MAINNET,
      onFinish: async (data) => {
        await fetch('/api/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'accept',
            project_id: id,
            applicant_address: applicantAddress,
            owner_address: address,
            tx_id: data.txId,
          }),
        });
      },
      onCancel: () => {},
    });
  }

  if (loading) return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-900 rounded-xl w-1/3" />
      <div className="h-32 bg-gray-900 rounded-2xl" />
    </div>
  );

  if (!project) return <div className="text-gray-400 py-20 text-center">Project not found.</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Project header */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
            <span className="text-sm text-gray-500">{project.category}</span>
          </div>
          <div className="flex items-center gap-2">
            {partnerRequest && (
              <span className="text-sm bg-orange-500/10 text-orange-400 border border-orange-500/20 px-3 py-1 rounded-lg">
                Hiring: {partnerRequest.role}
              </span>
            )}
            {isOwner && (
              <button
                onClick={startEdit}
                className="text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1 rounded-lg transition-colors"
              >
                Edit
              </button>
            )}
          </div>
        </div>

        {editing ? (
          <form onSubmit={handleSaveEdit} className="space-y-3">
            <textarea
              value={editForm.description}
              onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 resize-none"
            />
            <input
              value={editForm.website}
              onChange={e => setEditForm(f => ({ ...f, website: e.target.value }))}
              placeholder="Website URL"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
            />
            <input
              value={editForm.github}
              onChange={e => setEditForm(f => ({ ...f, github: e.target.value }))}
              placeholder="GitHub URL"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
            />
            <div className="flex gap-2">
              <button type="submit" disabled={saving}
                className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => setEditing(false)}
                className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-xl border border-gray-700 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <p className="text-gray-300 mb-4">{project.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex gap-4 text-sm">
                {project.website && <a href={project.website} target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">Website</a>}
                {project.github && <a href={project.github} target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">GitHub</a>}
              </div>
              {isOwner && (
                <button onClick={handleToggleOpen}
                  className={`text-xs px-3 py-1 rounded-lg border transition-colors ${
                    project.looking_for_partner
                      ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20'
                      : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/20'
                  }`}>
                  {project.looking_for_partner ? 'Open — click to close' : 'Closed — click to open'}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Partner request details */}
      {partnerRequest && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">Partner Request</h2>
          <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
            <div><span className="text-gray-500 block">Role</span><span className="text-white">{partnerRequest.role}</span></div>
            <div><span className="text-gray-500 block">Commitment</span><span className="text-white capitalize">{partnerRequest.commitment}</span></div>
            <div><span className="text-gray-500 block">Compensation</span><span className="text-white capitalize">{partnerRequest.compensation}</span></div>
          </div>
          {partnerRequest.skills?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {partnerRequest.skills.map(s => (
                <span key={s} className="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded-lg">{s}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Disconnected visitor CTA */}
      {!isConnected && partnerRequest && (
        <div className="bg-gray-900 border border-orange-500/20 rounded-2xl p-6 text-center">
          <p className="text-gray-300 mb-3">Connect your wallet to apply as a partner</p>
          <button
            onClick={() => connect('leather')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
          >
            Connect Wallet to Apply
          </button>
        </div>
      )}

      {/* Apply form — connected non-owner who hasn't applied */}
      {!isOwner && partnerRequest && isConnected && !hasApplied && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">Apply as Partner</h2>
          <form onSubmit={handleApply} className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Your Pitch</label>
              <textarea required value={pitch} onChange={e => setPitch(e.target.value)} rows={4}
                placeholder="Why are you a great fit for this project?"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500 resize-none" />
            </div>
            <div>
              <label className="text-sm text-gray-400 mb-1 block">Relevant Links (comma separated)</label>
              <input value={links} onChange={e => setLinks(e.target.value)}
                placeholder="GitHub, portfolio, past projects..."
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500" />
            </div>
            <TxStatus txId={txId} status={txStatus} />
            <button type="submit" disabled={submitting}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors">
              {submitting ? 'Opening wallet...' : 'Apply & Sign Transaction'}
            </button>
          </form>
        </div>
      )}

      {hasApplied && (
        <div className="text-center py-4 text-green-400 bg-green-500/5 border border-green-500/20 rounded-2xl">
          You have already applied to this project.
        </div>
      )}

      {/* Owner: applications list */}
      {isOwner && applications.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">Applications ({applications.length})</h2>
          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="border border-gray-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-mono text-sm">{app.applicant_address.slice(0, 10)}...</span>
                  <span className={`text-xs px-2 py-1 rounded-lg ${
                    app.status === 'accepted' ? 'bg-green-500/10 text-green-400' :
                    app.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                    'bg-yellow-500/10 text-yellow-400'
                  }`}>{app.status}</span>
                </div>
                <p className="text-gray-400 text-sm mb-3">{app.pitch}</p>
                {app.status === 'pending' && (
                  <button onClick={() => handleAccept(app.applicant_address)}
                    className="text-sm bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-lg transition-colors">
                    Accept Partner
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
