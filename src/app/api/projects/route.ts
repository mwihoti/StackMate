import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { projects, partnerRequests } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const ownerAddress = searchParams.get('ownerAddress');

  const rows = ownerAddress
    ? await db.select().from(projects).where(eq(projects.ownerAddress, ownerAddress)).orderBy(projects.createdAt)
    : await db.select().from(projects).where(eq(projects.lookingForPartner, true)).orderBy(projects.createdAt);

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { project, request } = body;

  const [inserted] = await db.insert(projects).values({
    id: project.id,
    ownerAddress: project.owner_address,
    name: project.name,
    category: project.category,
    description: project.description,
    website: project.website,
    github: project.github,
    teamMembers: project.team_members,
    lookingForPartner: true,
    txId: project.tx_id,
  }).returning();

  await db.insert(partnerRequests).values({
    projectId: inserted.id,
    role: request.role,
    skills: request.skills,
    commitment: request.commitment,
    compensation: request.compensation,
    description: request.description,
    isOpen: true,
    txId: request.tx_id,
  });

  return NextResponse.json(inserted, { status: 201 });
}
