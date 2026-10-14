import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateSecret, generateURI } from 'otplib';
import qrcode from 'qrcode';
import { getUserByUsername, createUser } from '@/lib/db';

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
    const { usernames } = await request.json();

    if (!usernames || (!Array.isArray(usernames) && typeof usernames !== 'string')) {
      return NextResponse.json({ error: 'Usernames list is required' }, { status: 400 });
    }

    const appName = process.env.APP_NAME || 'SKHLPSS Login System';

    // Parse list of usernames (handles newline or comma delimited string)
    let list = Array.isArray(usernames)
      ? usernames
      : usernames.split(/[\n,]+/).map((u) => u.trim()).filter(Boolean);

    // Remove duplicates
    list = [...new Set(list)];

    const createdUsers = [];
    const skippedUsers = [];

    for (const rawUsername of list) {
      const cleanUsername = rawUsername.trim();
      if (!cleanUsername) continue;

      if (getUserByUsername(cleanUsername)) {
        skippedUsers.push({ username: cleanUsername, reason: 'User already exists' });
        continue;
      }

      const secret = generateSecret();
      const user = createUser(cleanUsername, appName, secret);

      const otpauth = generateURI({
        issuer: appName,
        label: cleanUsername,
        secret,
      });
      const qrCodeUrl = await qrcode.toDataURL(otpauth);

      createdUsers.push({
        ...user,
        qrCodeUrl,
      });
    }

    return NextResponse.json({
      created: createdUsers,
      skipped: skippedUsers,
    });
  } catch (error) {
    console.error('Batch create error:', error);
    return NextResponse.json({ error: 'Failed to create batch users' }, { status: 500 });
  }
}
