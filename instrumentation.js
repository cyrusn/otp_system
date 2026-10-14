export async function register() {
  if (
    process.env.NEXT_RUNTIME !== 'nodejs' ||
    process.env.NEXT_PHASE === 'phase-production-build'
  ) {
    return;
  }

  const { initializeDatabase } = await import('./lib/db.js');
  try {
    initializeDatabase();
    console.info('SQLite database initialized.');
  } catch (error) {
    console.error(
      'Database initialization failed. Check DATABASE_PATH and ensure its directory is writable.',
      error
    );
    throw error;
  }

  const hasRootUsername = Boolean(process.env.ROOT_USERNAME);
  const hasRootPassword = Boolean(process.env.ROOT_PASSWORD);
  if (hasRootUsername && hasRootPassword) {
    console.info('Root admin username and password are present in the runtime environment.');
  } else {
    const missing = [
      !hasRootUsername && 'ROOT_USERNAME',
      !hasRootPassword && 'ROOT_PASSWORD',
    ].filter(Boolean);
    console.warn(
      `${missing.join(' and ')} ${missing.length === 1 ? 'is' : 'are'} missing; root admin login is disabled until both are configured.`
    );
  }
}
