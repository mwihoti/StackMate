'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import { useMyApplications } from '@/hooks/useApplications';
import type { Project, PartnerRequest, PartnerRole, CommitmentLevel, CompensationType } from '@/types';

const ROLES: PartnerRole[] = [
  'Frontend Developer', 'Backend Developer', 'Smart Contract Developer', 'Blockchain Developer',
  'UI/UX Designer', 'Product Manager', 'Marketing', 'Community Manager', 'Other',
];

export default function DashboardPage() {
  const { address, isConnected, isRestoring } = useWallet();
  const { applications, loading: appsLoading } = useMyApplications(address);
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [projLoading, setProjLoading] = useState(true);

  // Edit modal
  const [editStep, setEditStep] = useState<'select' | 'form' | null>(null);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [editRequest, setEditRequest] = useState<PartnerRequest | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    role: 'Frontend Developer' as PartnerRole,
    commitment: 'part-time' as CommitmentLevel,
    compensation: 'equity' as CompensationType,
  });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchProjects = useCallback(() => {
    if (!address) { setProjLoading(false); return; }
    setProjLoading(true);
    fetch(`/api/projects?ownerAddress=${address}`)
      .then(r => r.json())
      .then(data => { setMyProjects(data ?? []); setProjLoading(false); })
      .catch(() => setProjLoading(false));
  }, [address]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  function openEditModal() {
    setEditStep('select');
    setEditProject(null);
    setEditRequest(null);
    setDeleteConfirm(false);
  }

  function closeEditModal() {
    setEditStep(null);
    setEditProject(null);
    setEditRequest(null);
    setDeleteConfirm(false);
  }

  async function selectProject(p: Project) {
    const res = await fetch(`/api/projects/${p.id}`);
    const data = await res.json();
    const proj: Project = data.project ?? p;
    const req: PartnerRequest | null = data.partnerRequest ?? null;
    setEditProject(proj);
    setEditRequest(req);
    setEditForm({
      name: proj.name,
      role: req?.role ?? 'Frontend Developer',
      commitment: req?.commitment ?? 'part-time',
      compensation: req?.compensation ?? 'equity',
    });
    setEditStep('form');
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editProject || !address) return;
    setSaving(true);
    await fetch(`/api/projects/${editProject.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editForm, owner_address: address }),
    });
    setSaving(false);
    closeEditModal();
    fetchProjects();
  }

  async function handleDelete() {
    if (!editProject || !address) return;
    setDeleting(true);
    await fetch(`/api/projects/${editProject.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ owner_address: address }),
    });
    setDeleting(false);
    closeEditModal();
    fetchProjects();
  }

  if (isRestoring) {
    return <div className="py-20 text-center text-gray-400">Restoring wallet session...</div>;
  }

  if (!isConnected) {
    return (
      <div className="text-center py-20">
        <h2 className="text-white text-xl font-semibold mb-2">Connect your wallet</h2>
        <p className="text-gray-400">Connect to view your dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">

      {/* Edit Project Modal */}
      {editStep && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) closeEditModal(); }}
        >
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <h2 className="text-white font-semibold">
                {editStep === 'select' ? 'Select a project to edit' : `Editing — ${editProject?.name}`}
              </h2>
              <button
                onClick={closeEditModal}
                className="text-gray-500 hover:text-white transition-colors text-xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* Step 1 — Project selector */}
            {editStep === 'select' && (
              <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
                {myProjects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => selectProject(p)}
                    className="w-full text-left bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-orange-500/40 rounded-xl px-4 py-3 transition-all"
                  >
                    <p className="text-white font-medium">{p.name}</p>
                    <p className="text-gray-500 text-sm">{p.category}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2 — Edit form */}
            {editStep === 'form' && (
              <form onSubmit={handleSave} className="p-5 space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Project Name</label>
                  <input
                    required
                    value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Role Needed</label>
                  <select
                    value={editForm.role}
                    onChange={e => setEditForm(f => ({ ...f, role: e.target.value as PartnerRole }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Commitment</label>
                    <select
                      value={editForm.commitment}
                      onChange={e => setEditForm(f => ({ ...f, commitment: e.target.value as CommitmentLevel }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                    >
                      <option value="part-time">Part-time</option>
                      <option value="full-time">Full-time</option>
                      <option value="flexible">Flexible</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-1 block">Compensation</label>
                    <select
                      value={editForm.compensation}
                      onChange={e => setEditForm(f => ({ ...f, compensation: e.target.value as CompensationType }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
                    >
                      <option value="equity">Equity</option>
                      <option value="bounty">Bounty</option>
                      <option value="volunteer">Volunteer</option>
                      <option value="salary">Salary</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditStep('select'); setDeleteConfirm(false); }}
                    className="text-gray-400 hover:text-white text-sm px-4 py-2.5 rounded-xl border border-gray-700 transition-colors"
                  >
                    Back
                  </button>
                </div>

                <div className="border-t border-gray-800 pt-4">
                  {deleteConfirm ? (
                    <div className="space-y-2">
                      <p className="text-red-400 text-sm text-center">
                        Delete <span className="font-semibold">{editProject?.name}</span>? This cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleDelete}
                          disabled={deleting}
                          className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-xl transition-colors"
                        >
                          {deleting ? 'Deleting...' : 'Yes, Delete'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(false)}
                          className="flex-1 text-gray-400 hover:text-white text-sm py-2 rounded-xl border border-gray-700 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(true)}
                      className="w-full text-red-400 hover:text-red-300 text-sm py-2 rounded-xl border border-red-500/20 hover:border-red-500/40 transition-colors"
                    >
                      Delete Project
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* My Projects */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-xl font-bold">My Projects</h2>
          <div className="flex items-center gap-2">
            {myProjects.length > 0 && (
              <button
                onClick={openEditModal}
                className="text-sm text-gray-300 hover:text-white border border-gray-700 hover:border-gray-500 px-4 py-2 rounded-xl transition-colors"
              >
                Edit Project
              </button>
            )}
            <Link
              href="/projects/new"
              className="text-sm bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl transition-colors"
            >
              + New Project
            </Link>
          </div>
        </div>

        {projLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-900 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : myProjects.length === 0 ? (
          <p className="text-gray-500">
            No projects yet.{' '}
            <Link href="/projects/new" className="text-orange-400 hover:underline">Post one</Link>.
          </p>
        ) : (
          <div className="space-y-3">
            {myProjects.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`}>
                <div className="bg-gray-900 border border-gray-800 hover:border-orange-500/40 rounded-2xl p-4 flex items-center justify-between transition-all">
                  <div>
                    <p className="text-white font-medium">{p.name}</p>
                    <p className="text-gray-500 text-sm">{p.category}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-lg ${
                    p.looking_for_partner
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                      : 'bg-gray-800 text-gray-500'
                  }`}>
                    {p.looking_for_partner ? 'Open' : 'Closed'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* My Applications */}
      <div>
        <h2 className="text-white text-xl font-bold mb-4">My Applications</h2>
        {appsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-900 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : applications.length === 0 ? (
          <p className="text-gray-500">
            No applications yet.{' '}
            <Link href="/" className="text-orange-400 hover:underline">Browse projects</Link>.
          </p>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <div key={app.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Project #{app.project_id.slice(0, 8)}</p>
                  <p className="text-gray-500 text-sm">{new Date(app.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-lg border ${
                  app.status === 'accepted'
                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                    : app.status === 'rejected'
                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                    : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                }`}>
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
