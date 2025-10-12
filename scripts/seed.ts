import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../models/User';
import Ticket from '../models/Ticket';
import AuditLog from '../models/AuditLog';

// Sample data
const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123',
    role: 'admin' as const
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'user123',
    role: 'user' as const
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'user123',
    role: 'user' as const
  },
  {
    name: 'Bob Johnson',
    email: 'bob@example.com',
    password: 'user123',
    role: 'user' as const
  },
  {
    name: 'Alice Brown',
    email: 'alice@example.com',
    password: 'user123',
    role: 'user' as const
  },
  {
    name: 'Charlie Wilson',
    email: 'charlie@example.com',
    password: 'user123',
    role: 'user' as const
  },
  {
    name: 'Diana Davis',
    email: 'diana@example.com',
    password: 'user123',
    role: 'user' as const
  },
  {
    name: 'Support Admin',
    email: 'support@example.com',
    password: 'admin123',
    role: 'admin' as const
  }
];

const sampleTickets = [
  {
    title: 'Login Issues',
    description: 'I cannot log into my account. The password reset is not working.',
    status: 'open' as const,
    priority: 'high' as const,
    category: 'technical' as const
  },
  {
    title: 'Payment Processing Error',
    description: 'My payment was declined but my bank shows the charge. Please help resolve this.',
    status: 'closed' as const,
    priority: 'urgent' as const,
    category: 'billing' as const
  },
  {
    title: 'Feature Request: Dark Mode',
    description: 'It would be great to have a dark mode option for the application.',
    status: 'open' as const,
    priority: 'low' as const,
    category: 'feature_request' as const
  },
  {
    title: 'Bug Report: Dashboard Loading',
    description: 'The dashboard takes too long to load and sometimes shows a blank page.',
    status: 'open' as const,
    priority: 'medium' as const,
    category: 'bug_report' as const
  },
  {
    title: 'Account Deletion Request',
    description: 'I would like to delete my account and all associated data.',
    status: 'closed' as const,
    priority: 'medium' as const,
    category: 'general' as const
  },
  {
    title: 'Email Notifications Not Working',
    description: 'I am not receiving email notifications for ticket updates.',
    status: 'open' as const,
    priority: 'medium' as const,
    category: 'technical' as const
  },
  {
    title: 'Mobile App Crashes',
    description: 'The mobile app crashes when I try to upload files.',
    status: 'open' as const,
    priority: 'high' as const,
    category: 'bug_report' as const
  },
  {
    title: 'Billing Question',
    description: 'I have a question about my monthly billing cycle and charges.',
    status: 'closed' as const,
    priority: 'low' as const,
    category: 'billing' as const
  },
  {
    title: 'API Documentation Request',
    description: 'Could you provide more detailed API documentation with examples?',
    status: 'open' as const,
    priority: 'medium' as const,
    category: 'feature_request' as const
  },
  {
    title: 'Security Concern',
    description: 'I noticed some suspicious activity on my account. Please investigate.',
    status: 'closed' as const,
    priority: 'urgent' as const,
    category: 'technical' as const
  }
];

async function seedDatabase(dbUri: string, dbName: string) {
  console.log(`\n🌱 Seeding ${dbName} database...`);
  
  try {
    // Connect to database
    await mongoose.connect(dbUri, {
      bufferCommands: false,
    });
    console.log(`✅ Connected to ${dbName} database`);

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Ticket.deleteMany({});
    await AuditLog.deleteMany({});

    // Create users
    console.log('👥 Creating users...');
    const createdUsers = [];
    
    for (const userData of sampleUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      await user.save();
      createdUsers.push(user);
      console.log(`   ✓ Created user: ${userData.email} (${userData.role})`);
    }

    // Create tickets
    console.log('🎫 Creating tickets...');
    const createdTickets = [];
    
    for (let i = 0; i < sampleTickets.length; i++) {
      const ticketData = sampleTickets[i];
      // Assign tickets to random users (excluding admins for variety)
      const regularUsers = createdUsers.filter(u => u.role === 'user');
      const randomUser = regularUsers[Math.floor(Math.random() * regularUsers.length)];
      
      const ticket = new Ticket({
        ...ticketData,
        userId: randomUser._id.toString(),
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
      });
      await ticket.save();
      createdTickets.push(ticket);
      console.log(`   ✓ Created ticket: ${ticketData.title} (${ticketData.status})`);
    }

    // Create additional random tickets
    const additionalTicketTitles = [
      'Server Downtime Report',
      'Integration Help Needed',
      'Password Policy Question',
      'Data Export Request',
      'Performance Issues',
      'UI/UX Feedback',
      'Training Request',
      'License Upgrade',
      'Backup Restoration',
      'Custom Configuration',
      'Third-party Integration',
      'Compliance Question',
      'Feature Enhancement',
      'System Maintenance',
      'User Permission Issue'
    ];

    const priorities = ['low', 'medium', 'high', 'urgent'];
    const categories = ['technical', 'billing', 'general', 'feature_request', 'bug_report'];

    for (let i = 0; i < 15; i++) {
      const regularUsers = createdUsers.filter(u => u.role === 'user');
      const randomUser = regularUsers[Math.floor(Math.random() * regularUsers.length)];
      const randomTitle = additionalTicketTitles[i];
      const randomStatus = Math.random() > 0.6 ? 'open' : 'closed';
      const randomPriority = priorities[Math.floor(Math.random() * priorities.length)];
      const randomCategory = categories[Math.floor(Math.random() * categories.length)];

      const ticket = new Ticket({
        title: randomTitle,
        description: `This is a sample ticket for ${randomTitle.toLowerCase()}. It contains detailed information about the issue or request.`,
        status: randomStatus,
        priority: randomPriority,
        category: randomCategory,
        userId: randomUser._id.toString(),
        createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000), // Random date within last 60 days
      });
      await ticket.save();
      createdTickets.push(ticket);
      console.log(`   ✓ Created additional ticket: ${randomTitle} (${randomStatus}, ${randomPriority}, ${randomCategory})`);
    }

    // Create audit logs
    console.log('📋 Creating audit logs...');
    const auditActions = ['login', 'create_ticket', 'update_ticket', 'delete_ticket', 'view_tickets'];
    
    for (let i = 0; i < 50; i++) {
      const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      const randomAction = auditActions[Math.floor(Math.random() * auditActions.length)];
      const randomDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      
      const auditLog = new AuditLog({
        who: randomUser._id.toString(),
        what: randomAction,
        when: randomDate,
        details: `Sample audit log entry for ${randomAction} by ${randomUser.name}`,
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Sample User Agent)'
      });
      await auditLog.save();
    }

    console.log(`✅ Successfully seeded ${dbName} database!`);
    console.log(`   👥 Users: ${createdUsers.length}`);
    console.log(`   🎫 Tickets: ${createdTickets.length}`);
    console.log(`   📋 Audit Logs: 50`);

    // Disconnect
    await mongoose.disconnect();
    
  } catch (error) {
    console.error(`❌ Error seeding ${dbName} database:`, error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting database seeding process...');
  
  const primaryUri = process.env.PRIMARY_DB_URI;
  const secondaryUri = process.env.SECONDARY_DB_URI;

  if (!primaryUri || !secondaryUri) {
    console.error('❌ Database URIs not found in environment variables');
    console.log('Please ensure PRIMARY_DB_URI and SECONDARY_DB_URI are set in your .env.local file');
    process.exit(1);
  }

  try {
    // Seed primary database
    await seedDatabase(primaryUri, 'PRIMARY');
    
    // Seed secondary database
    await seedDatabase(secondaryUri, 'SECONDARY');
    
    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\nTest accounts created:');
    console.log('📧 admin@example.com (password: admin123) - Admin');
    console.log('📧 support@example.com (password: admin123) - Admin');
    console.log('📧 john@example.com (password: user123) - User');
    console.log('📧 jane@example.com (password: user123) - User');
    console.log('📧 And 4 more user accounts...');
    
  } catch (error) {
    console.error('❌ Seeding process failed:', error);
    process.exit(1);
  }
}

// Run the seeding script
if (require.main === module) {
  main();
}

export default main;
