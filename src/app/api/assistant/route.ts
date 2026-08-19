import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/session';
import { runAssistant } from '@/lib/ai';

export async function POST(req: NextRequest) {
  const user = await requireUser();
  const { messages } = await req.json();
  if (!Array.isArray(messages)) return NextResponse.json({ error: 'messages requis' }, { status: 400 });

  try {
    const reply = await runAssistant(user.companyId, messages);
    return NextResponse.json({ reply });
  } catch (e: any) {
    return NextResponse.json({ reply: `Une erreur est survenue : ${e.message}` });
  }
}
