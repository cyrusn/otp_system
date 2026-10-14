import { NextResponse } from 'next/server';
import { generateURI } from 'otplib';
import qrcode from 'qrcode';
import { deriveSecretFromPassword } from '@/lib/crypto';

export async function POST(request) {
  try {
    const { appName, username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and Password are required' }, { status: 400 });
    }

    const cleanAppName = (appName && appName.trim()) ? appName.trim() : 'TOTP Demo App';
    const cleanUsername = username.trim();

    // Derive a unique, deterministic Base32 secret using the password + .env master secret key
    const secret = deriveSecretFromPassword(password);

    // Generate otpauth URL format
    const otpauth = generateURI({
      issuer: cleanAppName,
      label: cleanUsername,
      secret,
    });

    // Generate Base64 Data URL for QR Code
    const qrCodeUrl = await qrcode.toDataURL(otpauth);

    return NextResponse.json({
      qrCodeUrl,
      secret,
      username: cleanUsername,
      appName: cleanAppName,
    });
  } catch (err) {
    console.error('Setup error:', err);
    return NextResponse.json({ error: 'Failed to generate QR Code' }, { status: 500 });
  }
}
