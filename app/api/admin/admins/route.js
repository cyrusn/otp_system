import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAllAdmins, getAdminByUsername, createAdmin, deleteAdmin } from '@/lib/db';

async function checkAuth() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return session && session.value;
}

// GET: List all secondary admins
export async function GET() {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const admins = getAllAdmins();
  return NextResponse.json({ admins });
}

// POST: Create a secondary admin
export async function POST(request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { username, password } = await request.json();

    if (!username || !username.trim()) {
      return NextResponse.json({ error: 'Admin username is required' }, { status: 400 });
    }
    if (!password || !password.trim()) {
      return NextResponse.json({ error: 'Admin password is required' }, { status: 400 });
    }

    const cleanUsername = username.trim();

    // Prevent creating admin with same name as root admin
    const rootUser = process.env.ROOT_USERNAME || 'admin';
    if (cleanUsername.toLowerCase() === rootUser.toLowerCase()) {
      return NextResponse.json({ error: 'Cannot create admin with root username' }, { status: 400 });
    }

    if (getAdminByUsername(cleanUsername)) {
      return NextResponse.json({ error: `Admin '${cleanUsername}' already exists` }, { status: 400 });
    }

    const admin = createAdmin(cleanUsername, password);
    return NextResponse.json({ admin });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create admin user' }, { status: 500 });
  }
}

// DELETE: Delete secondary admin
export async function DELETE(request) {
  if (!(await checkAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { username } = await request.json();
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const success = deleteAdmin(username);
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Admin user not found' }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete admin user' }, { status: 500 });
  }
}
