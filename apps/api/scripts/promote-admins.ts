import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const url = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error('Missing DATABASE_URL (or DIRECT_DATABASE_URL).');
  process.exit(1);
}

const pool = new Pool({ connectionString: url });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function parseEmails(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(/[;,]/g)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

async function main() {
  const emails = parseEmails(process.env.ADMIN_EMAILS);

  if (emails.length === 0) {
    console.error(
      'ADMIN_EMAILS is empty. Example: ADMIN_EMAILS="a@x.com;b@x.com"',
    );
    process.exit(1);
  }

  for (const email of emails) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      console.warn(`User not found for email: ${email}`);
      continue;
    }

    if (user.role === UserRole.ADMIN) {
      console.log(`Already ADMIN: ${email}`);
      continue;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { role: UserRole.ADMIN },
    });

    console.log(`Promoted to ADMIN: ${email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
