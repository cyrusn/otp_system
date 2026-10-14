import { NextResponse } from 'next/server';
import { verify, createGuardrails } from 'otplib';
import { getUserByUsername } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const u = searchParams.get('u');
    const p = searchParams.get('p');

    if (!u) {
      return NextResponse.json({ valid: false, error: 'Missing parameter u (username)' }, { status: 400 });
    }

    if (!p) {
      return NextResponse.json({ valid: false, error: 'Missing parameter p (PIN)' }, { status: 400 });
    }

    // Lookup user in SQLite
    const user = getUserByUsername(u.trim());

    if (!user) {
      return NextResponse.json({ valid: false, error: 'User not found' }, { status: 404 });
    }

    // Clean up spaces/hyphens in token
    const cleanedToken = p.replace(/[\s-]/g, '');

    // Verify token against user's stored secret
    const result = await verify({
      secret: user.secret,
      token: cleanedToken,
      guardrails: createGuardrails({ MIN_SECRET_BYTES: 1 }),
    });

    return NextResponse.json({
      valid: result.valid,
      username: user.username,
      appName: user.app_name,
    });
  } catch (error) {
    console.error('Validate error:', error);
    return NextResponse.json({ valid: false, error: 'Validation process error' }, { status: 500 });
  }
}
