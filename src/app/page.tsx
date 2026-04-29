'use client';

import { useState } from 'react';
import { useProjects } from '@/hooks/useProjects';
import { ProjectCard } from '@/components/projects/ProjectCard';
import type { ProjectCategory } from '@/types';

const CATEGORIES: ProjectCategory[] = [
  'DeFi', 'Gaming & Interactive', 'AI & Agents', 'Fintech & Payments',
  'Commerce & Marketplaces', 'Developer Tools & Infrastructure', 'Consumer Apps', 'Other',
];

export default function HomePage() {
  const { projects, loading } = useProjects();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ProjectCategory | 'All'>('All');

  const filtered = projects.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'All' || p.category === category;
    return matchSearch && matchCategory;
  });

  return (
    <div>
      {/* Hero */}
      <div className="text-center py-16 mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Find your builder partner<br />
          <span className="text-orange-400">on Bitcoin L2</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          Connect with Stacks builders. Find co-founders, collaborators, and teammates for your on-chain project.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as ProjectCategory | 'All')}
          className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-orange-500"
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-900 rounded-2xl h-44 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          No projects found.{' '}
          <a href="/projects/new" className="text-orange-400 hover:underline">Post yours</a>.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => <ProjectCard key={p.id} project={p} />)}
        </div>
      )}
    </div>
  );
}
