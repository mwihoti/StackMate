'use client';

import { useState, useEffect } from 'react';
import type { Application } from '@/types';

export function useApplications(projectId: string) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/applications?projectId=${projectId}`)
      .then(r => r.json())
      .then(data => { setApplications(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [projectId]);

  return { applications, loading };
}

export function useMyApplications(address: string | null) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) { setLoading(false); return; }
    fetch(`/api/applications?applicantAddress=${address}`)
      .then(r => r.json())
      .then(data => { setApplications(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [address]);

  return { applications, loading };
}
