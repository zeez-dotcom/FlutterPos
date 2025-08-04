import 'dotenv/config';
import { db } from './db';
import { users } from '@shared/schema';
import bcrypt from 'bcryptjs';

async function main() {
  const username = process.env.SEED_USERNAME ?? 'admin';
  const password = process.env.SEED_PASSWORD ?? 'admin123';
  const passwordHash = await bcrypt.hash(password, 10);

  await db
    .insert(users)
    .values({ username, passwordHash, role: 'super_admin' })
    .onConflictDoNothing({ target: users.username });

  console.log(`Seeded user "${username}" with password "${password}"`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error('Seeding failed', err);
  process.exit(1);
});
