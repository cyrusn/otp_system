import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateSecret, generateURI } from 'otplib';
import qrcode from 'qrcode';
import { getAllUsers, getUserByUsername, createUser, deleteUser } from '@/lib/db';

async function checkAuth() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return session && session.value;
}

// GET: List all users
export async function GET() {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const users = getAllUsers();
    return NextResponse.json({ users });
  } catch (error) {
    console.error('List users failed because the database could not be read:', error);
    return NextResponse.json(
      { error: 'Could not load users because the database could not be read' },
      { status: 500 }
    );
  }
}

// POST: Create single user
export async function POST(request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { username } = await request.json();

    if (!username || !username.trim()) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const cleanUsername = username.trim();
    const appName = process.env.APP_NAME || 'SKHLPSS Login System';

    // Check if user already exists
    const existing = getUserByUsername(cleanUsername);
    if (existing) {
      return NextResponse.json({ error: `User '${cleanUsername}' already exists` }, { status: 400 });
    }

    // Generate random secret for user
    const secret = generateSecret();

    // Save to SQLite
    const user = createUser(cleanUsername, appName, secret);

    // Generate QR Code
    const otpauth = generateURI({
      issuer: appName,
      label: cleanUsername,
      secret,
    });
    const qrCodeUrl = await qrcode.toDataURL(otpauth);

    return NextResponse.json({
      user,
      qrCodeUrl,
    });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

// DELETE: Delete user
export async function DELETE(request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { username } = await request.json();
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const success = deleteUser(username);
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
