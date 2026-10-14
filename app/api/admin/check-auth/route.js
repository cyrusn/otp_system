import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');

  if (session && session.value) {
    const rootUser = process.env.ROOT_USERNAME || 'admin';
    const isRoot = session.value === rootUser;
    return NextResponse.json({
      authenticated: true,
      username: session.value,
      isRoot,
    });
  }
  return NextResponse.json({ authenticated: false }, { status: 401 });
}
