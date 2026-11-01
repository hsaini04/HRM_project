import { createApp } from './app.js';
import { connectDB, disconnectDB } from './config/db.js';
import { env } from './config/env.js';
import { refreshOverdueStatuses } from './services/enrollmentService.js';

async function start() {
  try {
    await connectDB();
    console.log('✔ MongoDB connected');
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
