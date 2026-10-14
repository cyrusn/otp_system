This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Application paths

The production Docker image builds with `BASE_PATH=/otp` and is served at
`https://api.liping.edu.hk/otp/`. The Caddy handler should proxy the request
path unchanged to the application, for example:

```caddy
api.liping.edu.hk {
    handle /otp* {
        reverse_proxy localhost:4494
    }
}
```

Do not strip `/otp` before proxying. The public verification endpoint is
`https://api.liping.edu.hk/otp/api/validate?u=USERNAME&p=PIN`.

Local development leaves `BASE_PATH` unset, so the application remains at
`http://localhost:3000/` and its verification endpoint is
`http://localhost:3000/api/validate?u=USERNAME&p=PIN`.

## Production database and admin login

At Node server startup, the application creates the SQLite database and any
missing tables at `DATABASE_PATH`. The production database path must remain
inside `/app/data`, which is mounted from the server's `./data` directory.
Existing records are preserved; startup does not create or replace admin
credentials in SQLite. The root admin logs in using `ROOT_USERNAME` and
`ROOT_PASSWORD` from the runtime `.env.production` file. Check container logs
for database initialization failures or warnings that either root credential
is missing; root login remains disabled unless both are configured, and
credential values are not logged. Because deployment uses Docker's
`--env-file`, do not wrap these values or `DATABASE_PATH` in quotes; Docker
passes quote characters as part of the value. The startup diagnostics only
report whether each variable is present, never its value.

If the database needs to be initialized manually, run `./init-db.sh` in the
server's `~/otp_system` directory. It checks the running container's persistent
mount, creates only missing tables, and verifies SQLite integrity without
replacing existing records.

The Docker image includes `instrumentation.js`, so `npm start` performs this
database initialization before serving requests. The host-side deployment
scripts mount `./data` at `/app/data` and pass `.env.production` at runtime:

```bash
mkdir -p data
docker run -d --name otp-system \
  -v "$(pwd)/data:/app/data" \
  --env-file .env.production \
  -e BASE_PATH=/otp \
  cyrusn/otp-system:latest
```

If a login or user-list request cannot open SQLite, the API returns a
database-specific error and the server logs the underlying failure for
diagnosis.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
