/**
 * Lutron SkillBridge — synthetic demo-data seed (command line).
 *
 * RESET BEHAVIOUR: every run clears the SkillBridge collections in the database named by
 * MONGODB_URI and recreates the same fictional dataset, so running it repeatedly never
 * duplicates records. Dates are generated relative to "today" so due dates stay current.
 *
 * Usage: npm run seed            (from /server)
 *        npm run seed -- --force (required if NODE_ENV=production)
 */
import { connectDB, disconnectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { demoAccountTable } from './ensureDemoData.js';
import { seedDemoData } from './seedDemoData.js';

async function seed() {
  if (env.nodeEnv === 'production' && !process.argv.includes('--force')) {
    console.error('Refusing to reset data with NODE_ENV=production. Re-run with --force if you are sure.');
    process.exit(1);
  }

  await connectDB();
  console.log('Connected. Resetting SkillBridge demo collections…');
  const { counts, statusCounts } = await seedDemoData();

  console.log('\n✔ Seed complete — synthetic demonstration data only (not actual Lutron Electronics HR records)\n');
  console.table(counts);
  console.log('Enrolment status mix:', statusCounts);
  console.log('\nDefault demo accounts (pick the role on the sign-in page; no password):');
  console.table(demoAccountTable());

  await disconnectDB();
}

seed().catch(async (error) => {
  console.error('✖ Seed failed:', error);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
