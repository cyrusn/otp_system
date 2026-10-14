import { NextResponse } from 'next/server';
import { verify, createGuardrails } from 'otplib';
import { deriveSecretFromPassword } from '@/lib/crypto';

export async function POST(request) {
  try {
    const { password, token } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'Password is required to derive the secret key' }, { status: 400 });
    }

    if (!token) {
      return NextResponse.json({ error: '6-digit PIN is required' }, { status: 400 });
    }

    // Re-derive the exact same Base32 secret using the provided password + .env master secret key
    const secret = deriveSecretFromPassword(password);

    // Clean up spaces/hyphens in token
    const cleanedToken = token.replace(/[\s-]/g, '');

    // Verify the TOTP token against the derived secret
    const result = await verify({
      secret,
      token: cleanedToken,
      guardrails: createGuardrails({ MIN_SECRET_BYTES: 1 }),
    });

    return NextResponse.json({
      isValid: result.valid,
      derivedSecret: secret,
    });
  } catch (error) {
    console.error('TOTP verify error:', error);
    return NextResponse.json({ error: 'Verification error: ' + error.message }, { status: 500 });
  }
}
