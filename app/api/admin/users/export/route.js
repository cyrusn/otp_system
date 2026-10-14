import archiver from 'archiver';
import zipEncrypted from 'archiver-zip-encrypted';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { generateURI } from 'otplib';
import qrcode from 'qrcode';
import { isStrongExportPassword } from '@/lib/export-password';
import { getAllUsersWithSecrets, getUserByUsername } from '@/lib/db';

if (!archiver.isRegisteredFormat('zip-encrypted')) {
  archiver.registerFormat('zip-encrypted', zipEncrypted);
}

async function isAuthenticated() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  return Boolean(session?.value);
}

function parseUsernames(value) {
  if (value === undefined || value === null || value === '') return [];

  const values = Array.isArray(value) ? value : [value];
  if (values.some((username) => typeof username !== 'string')) {
    throw new TypeError('Usernames must be provided as text');
  }

  const parsed = values.flatMap((username) => username.split(/[\n,]+/))
    .map((username) => username.trim())
    .filter(Boolean);
  const unique = new Map();
  for (const username of parsed) {
    const key = username.toLowerCase();
    if (!unique.has(key)) unique.set(key, username);
  }
  return [...unique.values()];
}

function csvCell(value) {
  const text = String(value ?? '');
  const safeText = /^[\t\r\n ]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replaceAll('"', '""')}"`;
}

function getQrFilename(username) {
  let stem = username
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
    .replace(/[. ]+$/, '');
  if (!stem) stem = 'user';
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i.test(stem)) {
    stem = `_${stem}`;
  }
  return `${stem}.png`;
}

async function createEncryptedZip(files, password) {
  const archive = archiver.create('zip-encrypted', {
    zlib: { level: 8 },
    encryptionMethod: 'aes256',
    password,
  });
  const chunks = [];
  const output = (async () => {
    for await (const chunk of archive) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  })();

  for (const file of files) {
    archive.append(file.content, { name: file.name });
  }

  const finalizing = archive.finalize();
  const [zip] = await Promise.all([output, finalizing]);
  return zip;
}

export async function POST(request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { password, usernames: rawUsernames } = body ?? {};
  if (!isStrongExportPassword(password)) {
    return NextResponse.json(
      { error: 'Password must be at least 8 characters and include uppercase, lowercase, a digit, and one of ! @ # $ % ^ & *' },
      { status: 400 }
    );
  }

  let usernames;
  try {
    usernames = parseUsernames(rawUsernames);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const users = usernames.length
    ? usernames.map((username) => getUserByUsername(username))
    : getAllUsersWithSecrets();

  if (users.some((user) => !user)) {
    const missing = usernames.filter((_, index) => !users[index]);
    return NextResponse.json(
      { error: `User(s) not found: ${missing.join(', ')}` },
      { status: 404 }
    );
  }

  if (users.length === 0) {
    return NextResponse.json({ error: 'There are no users to export' }, { status: 400 });
  }

  const filenames = new Set();
  const namedUsers = [];
  for (const user of users) {
    const baseFilename = getQrFilename(user.username);
    let filename = baseFilename;
    let suffix = 1;
    while (filenames.has(filename.toLowerCase())) {
      filename = `${baseFilename.slice(0, -4)}-${user.id}${suffix > 1 ? `-${suffix}` : ''}.png`;
      suffix += 1;
    }
    filenames.add(filename.toLowerCase());
    namedUsers.push({ user, filename });
  }

  try {
    const files = [];
    const rows = [['username', 'app_name', 'created_at']];

    for (const { user, filename } of namedUsers) {
      const otpauth = generateURI({
        issuer: user.app_name,
        label: user.username,
        secret: user.secret,
      });
      const image = await qrcode.toBuffer(otpauth, { type: 'png' });
      files.push({ name: filename, content: image });
      rows.push([user.username, user.app_name, user.created_at]);
    }

    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
    files.unshift({ name: 'users.csv', content: Buffer.from(csv, 'utf8') });
    const zip = await createEncryptedZip(files, password);

    return new Response(zip, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="users-export.zip"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('User export error:', error);
    return NextResponse.json({ error: 'Failed to prepare user export' }, { status: 500 });
  }
}
