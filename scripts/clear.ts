import mongoose from 'mongoose';
import User from '../models/User';
import Ticket from '../models/Ticket';
import AuditLog from '../models/AuditLog';

async function clearDatabase(dbUri: string, dbName: string) {
  console.log(`\n🧹 Clearing ${dbName} database...`);

  try {
    // Connect to database
    await mongoose.connect(dbUri, {
      bufferCommands: false,
    });
    console.log(`✅ Connected to ${dbName} database`);

    // Clear existing data
    console.log('🗑️ Deleting all users...');
    const deletedUsers = await User.deleteMany({});
    console.log(`   ✓ Deleted ${deletedUsers.deletedCount} users`);

    console.log('🗑️ Deleting all tickets...');
    const deletedTickets = await Ticket.deleteMany({});
    console.log(`   ✓ Deleted ${deletedTickets.deletedCount} tickets`);

    console.log('🗑️ Deleting all audit logs...');
    const deletedAuditLogs = await AuditLog.deleteMany({});
    console.log(`   ✓ Deleted ${deletedAuditLogs.deletedCount} audit logs`);

    console.log(`✅ Successfully cleared ${dbName} database!`);

    // Disconnect
    await mongoose.disconnect();

  } catch (error) {
    console.error(`❌ Error clearing ${dbName} database:`, error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting database clearing process...');

  const primaryUri = process.env.PRIMARY_DB_URI;
  const secondaryUri = process.env.SECONDARY_DB_URI;

  if (!primaryUri || !secondaryUri) {
    console.error('❌ Database URIs not found in environment variables');
    console.log('Please ensure PRIMARY_DB_URI and SECONDARY_DB_URI are set in your .env.local file');
    process.exit(1);
  }

  try {
    // Clear primary database
    await clearDatabase(primaryUri, 'PRIMARY');

    // Clear secondary database
    await clearDatabase(secondaryUri, 'SECONDARY');

    console.log('\n🎉 Database clearing completed successfully!');

  } catch (error) {
    console.error('❌ Clearing process failed:', error);
    process.exit(1);
  }
}

// Run the clearing script
if (require.main === module) {
  main();
}

export default main;