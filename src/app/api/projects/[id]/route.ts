import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { projects, partnerRequests, applications, partnerships } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;

  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [request] = await db
    .select()
    .from(partnerRequests)
    .where(and(eq(partnerRequests.projectId, id), eq(partnerRequests.isOpen, true)));

  return NextResponse.json({ project, partnerRequest: request ?? null });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;
  const body = await req.json();

  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (project.ownerAddress !== body.owner_address)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.description !== undefined) updates.description = body.description;
  if (body.website !== undefined) updates.website = body.website;
  if (body.github !== undefined) updates.github = body.github;
  if (body.looking_for_partner !== undefined) updates.lookingForPartner = body.looking_for_partner;

  if (Object.keys(updates).length > 0) {
    await db.update(projects).set(updates).where(eq(projects.id, id));
  }

  if (body.role !== undefined || body.commitment !== undefined || body.compensation !== undefined) {
    const reqUpdates: Record<string, unknown> = {};
    if (body.role !== undefined) reqUpdates.role = body.role;
    if (body.commitment !== undefined) reqUpdates.commitment = body.commitment;
    if (body.compensation !== undefined) reqUpdates.compensation = body.compensation;
    await db.update(partnerRequests).set(reqUpdates).where(
      and(eq(partnerRequests.projectId, id), eq(partnerRequests.isOpen, true))
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (project.ownerAddress !== body.owner_address)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await db.delete(applications).where(eq(applications.projectId, id));
  await db.delete(partnerships).where(eq(partnerships.projectId, id));
  await db.delete(partnerRequests).where(eq(partnerRequests.projectId, id));
  await db.delete(projects).where(eq(projects.id, id));

  return NextResponse.json({ ok: true });
}
