export type WalletType = 'leather' | 'xverse' | 'metamask' | 'asigna' | 'fordefi';

export type ProjectCategory =
  | 'DeFi'
  | 'Gaming & Interactive'
  | 'AI & Agents'
  | 'Fintech & Payments'
  | 'Commerce & Marketplaces'
  | 'Developer Tools & Infrastructure'
  | 'Education'
  | 'Consumer Apps'
  | 'Other';

export type PartnerRole =
  | 'Frontend Developer'
  | 'Backend Developer'
  | 'Smart Contract Developer'
  | 'UI/UX Designer'
  | 'Product Manager'
  | 'Marketing'
  | 'Community Manager'
  | 'Blockchain Developer'
  | 'Other';

export type CommitmentLevel = 'part-time' | 'full-time' | 'flexible';
export type CompensationType = 'equity' | 'bounty' | 'volunteer' | 'salary';
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

export interface Project {
  id: string;
  owner_address: string;
  name: string;
  category: ProjectCategory;
  description: string;
  website?: string;
  github?: string;
  team_members: TeamMember[];
  looking_for_partner: boolean;
  tx_id?: string;
  created_at: string;
}

export interface PartnerRequest {
  id: string;
  project_id: string;
  role: PartnerRole;
  skills: string[];
  commitment: CommitmentLevel;
  compensation: CompensationType;
  description: string;
  tx_id?: string;
  is_open: boolean;
  created_at: string;
}

export interface Application {
  id: string;
  project_id: string;
  applicant_address: string;
  pitch: string;
  links: string[];
  skills: string[];
  status: ApplicationStatus;
  tx_id?: string;
  created_at: string;
}

export interface Partnership {
  id: string;
  project_id: string;
  partner_address: string;
  owner_address: string;
  tx_id?: string;
  endorsed_by_owner: boolean;
  endorsed_by_partner: boolean;
  formed_at: string;
}

export interface TeamMember {
  address: string;
  name?: string;
  role: string;
}

export interface UserProfile {
  address: string;
  name?: string;
  bio?: string;
  skills: string[];
  github?: string;
  twitter?: string;
  looking_for_project: boolean;
}
