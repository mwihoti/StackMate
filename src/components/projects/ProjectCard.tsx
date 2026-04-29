import Link from 'next/link';
import type { Project, PartnerRequest } from '@/types';

interface Props {
  project: Project;
  request?: PartnerRequest;
}

export function ProjectCard({ project, request }: Props) {
  return (
    <Link href={`/projects/${project.id}`}>
      <div className="bg-gray-900 border border-gray-800 hover:border-orange-500/50 rounded-2xl p-5 transition-all cursor-pointer group">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-white font-semibold group-hover:text-orange-400 transition-colors">
              {project.name}
            </h3>
            <span className="text-xs text-gray-500 mt-0.5 block">{project.category}</span>
          </div>
          {request && (
            <span className="text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-1 rounded-lg">
              {request.role}
            </span>
          )}
        </div>
        <p className="text-gray-400 text-sm line-clamp-2 mb-4">{project.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {(project.team_members ?? []).slice(0, 3).map((m, i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center text-xs text-gray-300"
              >
                {m.address.slice(2, 3).toUpperCase()}
              </div>
            ))}
            <span className="text-xs text-gray-500 ml-1">
              {(project.team_members ?? []).length} member{(project.team_members ?? []).length !== 1 ? 's' : ''}
            </span>
          </div>
          {request && (
            <span className="text-xs text-gray-500">{request.commitment} · {request.compensation}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
