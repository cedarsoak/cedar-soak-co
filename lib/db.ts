import { neon } from "@neondatabase/serverless";

// Postgres via Neon (what Vercel's "Postgres" storage option installs).
// Vercel adds DATABASE_URL automatically when you connect the database to the
// project. Tables are created automatically the first time they're needed.

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type SqlTag = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Row[]>;
type SqlClient = SqlTag & { query: (text: string, params?: unknown[]) => Promise<Row[]> };

let client: SqlClient | null = null;
let schemaReady: Promise<void> | null = null;

function getClient(): SqlClient {
  if (!client) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) {
      throw new Error("DATABASE_URL is not set. Connect a Postgres database to the Vercel project (see BOOKING-SETUP.md).");
    }
    client = neon(url) as unknown as SqlClient;
  }
  return client;
}

const SCHEMA: string[] = [
  `CREATE TABLE IF NOT EXISTS bookings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ref text UNIQUE NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    source text NOT NULL DEFAULT 'website',
    start_date text NOT NULL,
    end_date text NOT NULL,
    nights int NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    phone text NOT NULL DEFAULT '',
    address text NOT NULL DEFAULT '',
    city text NOT NULL DEFAULT '',
    state text NOT NULL DEFAULT 'OH',
    zip text NOT NULL DEFAULT '',
    occasion text,
    heat text,
    package text NOT NULL DEFAULT 'escape',
    guests int,
    notes text,
    admin_notes text,
    referral text,
    promo_code text,
    referred_by text,
    nightly_rate_cents int NOT NULL,
    bonus_night boolean NOT NULL DEFAULT false,
    package_cents int NOT NULL DEFAULT 0,
    delivery_miles numeric,
    delivery_miles_estimated boolean NOT NULL DEFAULT false,
    delivery_override_cents int,
    discount_cents int NOT NULL DEFAULT 0,
    credit_cents int NOT NULL DEFAULT 0,
    credit_note text,
    discount_note text,
    extras_cents int NOT NULL DEFAULT 0,
    extras_note text,
    deposit_cents int NOT NULL DEFAULT 24900,
    deposit_status text NOT NULL DEFAULT 'unpaid',
    waiver_signed_at timestamptz,
    waiver_name text,
    waiver_token text UNIQUE,
    hold_expires_at timestamptz,
    confirmed_at timestamptz,
    cancelled_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
  )`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS referred_by text`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS credit_cents int NOT NULL DEFAULT 0`,
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS credit_note text`,
  `CREATE TABLE IF NOT EXISTS referral_credits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL,
    amount_cents int NOT NULL,
    from_booking_id uuid UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
    applied_booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'available',
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS referral_credits_email_idx ON referral_credits (lower(email))`,
  `CREATE INDEX IF NOT EXISTS bookings_dates_idx ON bookings (start_date, end_date)`,
  `CREATE INDEX IF NOT EXISTS bookings_email_idx ON bookings (lower(email))`,
  `CREATE TABLE IF NOT EXISTS payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    kind text NOT NULL,
    method text NOT NULL,
    amount_cents int NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    refund_of uuid REFERENCES payments(id) ON DELETE SET NULL,
    stripe_session_id text UNIQUE,
    stripe_payment_intent text,
    checkout_url text,
    note text,
    created_at timestamptz NOT NULL DEFAULT now(),
    paid_at timestamptz
  )`,
  `CREATE INDEX IF NOT EXISTS payments_booking_idx ON payments (booking_id)`,
  `CREATE TABLE IF NOT EXISTS booking_files (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    kind text NOT NULL DEFAULT 'other',
    filename text NOT NULL,
    content_type text NOT NULL,
    size_bytes int NOT NULL,
    data_b64 text NOT NULL,
    note text,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS booking_files_booking_idx ON booking_files (booking_id)`,
  `CREATE TABLE IF NOT EXISTS blocked_dates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    start_date text NOT NULL,
    end_date text NOT NULL,
    reason text,
    created_at timestamptz NOT NULL DEFAULT now()
  )`,
];

async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const c = getClient();
      for (const statement of SCHEMA) {
        await c.query(statement);
      }
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}

/** Tagged-template query: await sql`SELECT * FROM bookings WHERE id = ${id}` */
export async function sql(strings: TemplateStringsArray, ...values: unknown[]): Promise<Row[]> {
  await ensureSchema();
  return getClient()(strings, ...values);
}

/** Plain query with $1, $2 placeholders — for dynamic statements. */
export async function query(text: string, params: unknown[] = []): Promise<Row[]> {
  await ensureSchema();
  return getClient().query(text, params);
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);
}
