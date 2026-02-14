import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { analyticsEvents } from '@/lib/db/schema';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = getDb();

    await db.insert(analyticsEvents).values({
      sessionId: body.sessionId ?? 'anonymous',
      eventType: body.eventType ?? 'page_view',
      eventData: body.eventData ? JSON.stringify(body.eventData) : null,
      page: body.page ?? null,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
