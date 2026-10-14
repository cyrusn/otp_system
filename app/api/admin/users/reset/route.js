import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateSecret, generateURI } from 'otplib';
import qrcode from 'qrcode';
import { getUserByUsername, updateUserSecret } from '@/lib/db';

async function checkAuth() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return session && session.value;
}

export async function POST(request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const user = getUserByUsername(username);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate brand new random secret
    const newSecret = generateSecret();
    updateUserSecret(username, newSecret);

    const otpauth = generateURI({
      issuer: user.app_name,
      label: user.username,
      secret: newSecret,
    });
    const qrCodeUrl = await qrcode.toDataURL(otpauth);

    return NextResponse.json({
      username: user.username,
      appName: user.app_name,
      qrCodeUrl,
      message: 'Secret reset successfully',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to reset user secret' }, { status: 500 });
  }
}
