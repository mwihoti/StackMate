'use client';

import { useState, useEffect } from 'react';
import type { Project, PartnerRequest } from '@/types';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => { setProjects(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return { projects, loading };
}

export function useProject(id: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [partnerRequest, setPartnerRequest] = useState<PartnerRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then(r => r.json())
      .then(data => {
        setProject(data.project ?? null);
        setPartnerRequest(data.partnerRequest ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id, tick]);

  return { project, partnerRequest, loading, refetch: () => setTick(t => t + 1) };
}
