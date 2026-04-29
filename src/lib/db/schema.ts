import { pgTable, text, boolean, timestamp, jsonb, uuid } from 'drizzle-orm/pg-core';

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerAddress: text('owner_address').notNull(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  description: text('description').notNull(),
  website: text('website'),
  github: text('github'),
  teamMembers: jsonb('team_members').notNull().default([]),
  lookingForPartner: boolean('looking_for_partner').notNull().default(false),
  txId: text('tx_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const partnerRequests = pgTable('partner_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  role: text('role').notNull(),
  skills: jsonb('skills').notNull().default([]),
  commitment: text('commitment').notNull(),
  compensation: text('compensation').notNull(),
  description: text('description'),
  isOpen: boolean('is_open').notNull().default(true),
  txId: text('tx_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const applications = pgTable('applications', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  applicantAddress: text('applicant_address').notNull(),
  pitch: text('pitch').notNull(),
  links: jsonb('links').notNull().default([]),
  skills: jsonb('skills').notNull().default([]),
  status: text('status').notNull().default('pending'),
  txId: text('tx_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const partnerships = pgTable('partnerships', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  partnerAddress: text('partner_address').notNull(),
  ownerAddress: text('owner_address').notNull(),
  endorsedByOwner: boolean('endorsed_by_owner').notNull().default(false),
  endorsedByPartner: boolean('endorsed_by_partner').notNull().default(false),
  txId: text('tx_id'),
  formedAt: timestamp('formed_at').notNull().defaultNow(),
});
