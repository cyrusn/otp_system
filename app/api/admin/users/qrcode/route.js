import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateURI } from 'otplib';
import qrcode from 'qrcode';
import { getUserByUsername } from '@/lib/db';

async function checkAuth() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return session && session.value;
}

export async function GET(request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json({ error: 'Username parameter is required' }, { status: 400 });
  }

  const user = getUserByUsername(username);

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  try {
    const otpauth = generateURI({
      issuer: user.app_name,
      label: user.username,
      secret: user.secret,
    });
    const qrCodeUrl = await qrcode.toDataURL(otpauth);

    return NextResponse.json({
      username: user.username,
      appName: user.app_name,
      createdAt: user.created_at,
      qrCodeUrl,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to generate QR code' }, { status: 500 });
  }
}
