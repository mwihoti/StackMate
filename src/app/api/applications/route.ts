import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { applications, partnerships, partnerRequests } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const applicantAddress = searchParams.get('applicantAddress');

  if (projectId) {
    const rows = await db.select().from(applications).where(eq(applications.projectId, projectId));
    return NextResponse.json(rows);
  }

  if (applicantAddress) {
    const rows = await db.select().from(applications).where(eq(applications.applicantAddress, applicantAddress));
    return NextResponse.json(rows);
  }

  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  const db = getDb();
  const body = await req.json();
  const { action } = body;

  if (action === 'apply') {
    const [inserted] = await db.insert(applications).values({
      projectId: body.project_id,
      applicantAddress: body.applicant_address,
      pitch: body.pitch,
      links: body.links ?? [],
      skills: body.skills ?? [],
      status: 'pending',
      txId: body.tx_id,
    }).returning();
    return NextResponse.json(inserted, { status: 201 });
  }

  if (action === 'accept') {
    await db
      .update(applications)
      .set({ status: 'accepted' })
      .where(
        and(
          eq(applications.projectId, body.project_id),
          eq(applications.applicantAddress, body.applicant_address),
        )
      );

    await db
      .update(partnerRequests)
      .set({ isOpen: false })
      .where(eq(partnerRequests.projectId, body.project_id));

    const [partnership] = await db.insert(partnerships).values({
      projectId: body.project_id,
      partnerAddress: body.applicant_address,
      ownerAddress: body.owner_address,
      txId: body.tx_id,
    }).returning();

    return NextResponse.json(partnership, { status: 201 });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
