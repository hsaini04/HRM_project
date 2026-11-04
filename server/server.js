import { createApp } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { env } from './config/env.js';
import { demoAccountTable, ensureDemoData } from './seed/ensureDemoData.js';
import { refreshOverdueStatuses } from './services/enrollmentService.js';

// Creates the default demo accounts (and, for an empty database, the whole demo dataset) so the
// sign-in page works on a fresh install. A failure here is reported but does not stop the API.
async function prepareDemoAccounts() {
  if (!env.autoSeed) return;
  try {
    const result = await ensureDemoData();
    if (result.action === 'seeded') console.log('✔ Empty database: created the demo dataset and default accounts');
    if (result.action === 'accounts') console.log(`✔ Recreated missing demo account(s): ${result.created.join(', ')}`);
    if (result.action !== 'none') console.table(demoAccountTable());
  } catch (error) {
    console.error(`✖ Could not create the default demo accounts: ${error.message}`);
    console.error('  Run `npm run seed` to reset the demo data.');
  }
}

async function start() {
  try {
    await connectDB();
    console.log('✔ MongoDB connected');
    await prepareDemoAccounts();
    const updated = await refreshOverdueStatuses();
    if (updated) console.log(`✔ Marked ${updated} enrolment(s) as overdue`);
  } catch (error) {
    console.error(`✖ Could not connect to MongoDB: ${error.message}`);
    console.error('  Check MONGODB_URI in server/.env and that MongoDB is running.');
    process.exit(1);
  }

  const server = createApp().listen(env.port, () => {
    console.log(`✔ Lutron SkillBridge API running on http://localhost:${env.port}/api`);
    console.log('  Demonstration data only — not actual Lutron Electronics HR records.');
  });

  const shutdown = async () => {
    server.close();
    await disconnectDB();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start();
