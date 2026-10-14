import { NextResponse } from 'next/server';
import { verifyAdminPassword } from '@/lib/db';

export async function POST(request) {
  try {
    const credentials = await request.json();
    const { username, password } = credentials ?? {};
    if (typeof username !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    const rootUser = process.env.ROOT_USERNAME;
    const rootPass = process.env.ROOT_PASSWORD;

    // 1. Check Root Admin (.env)
    const isRoot = Boolean(rootUser && rootPass && username === rootUser && password === rootPass);

    // 2. Check Secondary Admins (SQLite)
    let isDbAdmin = false;
    if (!isRoot) {
      try {
        isDbAdmin = verifyAdminPassword(username, password);
      } catch (error) {
        console.error('Admin login could not query the admin database:', error);
        return NextResponse.json(
          { error: 'Login unavailable because the admin database could not be opened' },
          { status: 500 }
        );
      }
    }

    if (isRoot || isDbAdmin) {
      const response = NextResponse.json({
        success: true,
        username,
        isRoot,
      });

      response.cookies.set('admin_session', username, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24, // 1 day
        path: '/',
      });

      return response;
    }

    return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
  } catch (error) {
    console.error('Admin login failed while checking credentials or database:', error);
    return NextResponse.json({ error: 'Login service unavailable' }, { status: 500 });
  }
}
