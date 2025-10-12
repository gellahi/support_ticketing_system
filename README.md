# Support Ticketing System

A complete, production-ready support ticketing system built with Next.js, featuring dual database support, role-based access control, comprehensive audit logging, and advanced ticket management capabilities.

## 🚀 Features

### **Authentication & Authorization**
- User registration and login with NextAuth.js
- Role-based access control (admin/user)
- Secure password hashing with bcrypt
- Session management with JWT

### **Advanced Ticket Management**
- Create, view, update, and delete tickets
- **Priority levels**: Low, Medium, High, Urgent
- **Categories**: Technical, Billing, General, Feature Request, Bug Report
- **Comments system**: Threaded conversations on tickets
- **Ticket history**: Complete audit trail of all changes
- Status management (open/closed)
- Full-text search across tickets
- Advanced filtering and sorting

### **Enhanced Dashboard**
- **Statistics dashboard**: Total tickets, open/closed counts, priority breakdown
- **Advanced filtering**: By status, priority, category, date range
- **Search functionality**: Find tickets by title or description
- **Sorting options**: By date, title, priority, status
- **Pagination**: Handle large datasets efficiently
- **Real-time updates**: Live status and statistics

### **Admin Panel Features**
- **Database management**: Real-time switching between primary/secondary databases
- **Connection testing**: Test database connectivity without switching
- **User management**: View all users and manage roles
- **System statistics**: Comprehensive overview of system usage
- **Audit log viewer**: Complete system activity tracking

### **Dual Database Support**
- Primary and secondary MongoDB connections
- **Automatic failover mechanism** with proper error handling
- **Real-time database switching** via admin panel
- Environment-based database configuration
- Connection status monitoring

### **Comprehensive Audit Logging**
- Track all critical actions (login, ticket operations, admin actions)
- Append-only audit trail with IP tracking
- Admin-only audit log viewer with filtering
- Export capabilities (CSV/JSON)

### **Professional UI/UX**
- Modern, responsive design with TailwindCSS
- **Loading states and skeleton screens**
- **Toast notifications** for user feedback
- **Confirmation modals** for destructive actions
- Mobile-responsive design
- Professional color scheme with visual hierarchy

### **Database Seeding**
- Comprehensive seeding script with realistic test data
- Populates both primary and secondary databases identically
- Creates users, tickets, comments, and audit logs
- Perfect for testing and development

## 🛠 Tech Stack

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js with credentials provider
- **Styling**: TailwindCSS
- **Development**: ESLint, TypeScript, tsx for script running

## 📋 Setup Instructions

### 1. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-make-it-long-and-random

# MongoDB Database URIs
PRIMARY_DB_URI=mongodb://localhost:27017/ticketing_system_primary
SECONDARY_DB_URI=mongodb://localhost:27017/ticketing_system_secondary

# Database Failover Control (optional)
USE_SECONDARY_DB=false
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Seed the Database (Optional but Recommended)

Populate both databases with realistic test data:

```bash
npm run seed
```

This creates:
- 8 users (2 admins, 6 regular users)
- 25+ tickets with various priorities and categories
- 50+ audit log entries
- Realistic timestamps and relationships

**Test Accounts Created:**
- **Admin**: admin@example.com / admin123
- **Admin**: support@example.com / admin123
- **Users**: john@example.com, jane@example.com, etc. / user123

### 4. Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## 🔄 Database Failover Testing

Test the robust failover mechanism using any of these methods:

### **Method 1: Admin Panel (Recommended)**
1. Login as admin
2. Go to Dashboard → Admin Settings
3. Test connections and switch databases in real-time
4. Monitor connection status and performance

### **Method 2: Environment Variable**
```bash
# In .env.local
USE_SECONDARY_DB=true
```
Restart the application to use secondary database.

### **Method 3: Simulate Primary Failure**
- Stop your primary MongoDB instance
- The system automatically switches to secondary
- All operations continue seamlessly

### **Method 4: Invalid Primary URI**
- Temporarily change `PRIMARY_DB_URI` to invalid connection
- System falls back to secondary database automatically

## 📊 Usage Guide

### **For Regular Users:**
1. **Register/Login**: Create account or use test credentials
2. **Create Tickets**: Use the enhanced form with priority and category
3. **View Tickets**: See your tickets with filtering and search
4. **Add Comments**: Engage in conversations on your tickets
5. **Track History**: View complete timeline of ticket changes

### **For Administrators:**
1. **Dashboard Overview**: Monitor system statistics and activity
2. **Manage All Tickets**: View, update, and close any ticket
3. **Database Management**: Switch databases and monitor connections
4. **Audit Logs**: Review all system activity and user actions
5. **User Management**: Oversee user accounts and permissions

## 🏗 Project Structure

```
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/              # Authentication endpoints
│   │   ├── tickets/           # Ticket CRUD operations
│   │   │   └── [id]/          # Individual ticket operations
│   │   │       ├── comments/  # Comment system
│   │   │       └── history/   # Ticket history
│   │   ├── audit-logs/        # Audit log endpoints
│   │   └── admin/             # Admin-only endpoints
│   ├── admin/                 # Admin panel pages
│   │   ├── audit-logs/        # Audit log viewer
│   │   └── settings/          # Database management
│   ├── dashboard/             # Enhanced main dashboard
│   ├── tickets/[id]/          # Detailed ticket view
│   └── login/                 # Authentication pages
├── components/                # Reusable React components
├── lib/                       # Core utilities
│   ├── auth.ts               # NextAuth configuration
│   ├── db.ts                 # Database connection with failover
│   └── audit.ts              # Audit logging system
├── models/                    # Mongoose schemas
│   ├── User.ts               # User model with roles
│   ├── Ticket.ts             # Enhanced ticket model
│   ├── Comment.ts            # Comment system model
│   ├── TicketHistory.ts      # Change tracking model
│   └── AuditLog.ts           # System audit model
├── scripts/                   # Utility scripts
│   └── seed.ts               # Database seeding script
└── types/                     # TypeScript definitions
```

## 🔧 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build optimized production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality
- `npm run seed` - Populate databases with test data

## 🚀 Deployment

Ready for production deployment on Vercel, Netlify, or any Node.js platform:

### **Vercel Deployment:**
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### **Environment Variables for Production:**
```env
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-production-secret
PRIMARY_DB_URI=mongodb+srv://user:pass@cluster.mongodb.net/primary
SECONDARY_DB_URI=mongodb+srv://user:pass@cluster.mongodb.net/secondary
```

## 🔍 Key Technical Features

### **Database Failover Implementation**
- **Proper async/await handling** in connection logic
- **Connection timeouts** and retry mechanisms
- **Real-time status monitoring** and reporting
- **Seamless switching** without data loss
- **Admin panel integration** for manual control

### **Advanced Filtering & Search**
- **Full-text search** using MongoDB text indexes
- **Multi-field filtering** (status, priority, category)
- **Sorting capabilities** with multiple options
- **Pagination** for performance with large datasets
- **Real-time statistics** and counts

### **Security & Access Control**
- **Role-based permissions** enforced at API level
- **Input validation** and sanitization
- **SQL injection prevention** through Mongoose
- **Session security** with NextAuth.js
- **Audit trail** for accountability

### **Performance Optimizations**
- **Database indexing** for fast queries
- **Connection pooling** to prevent exhaustion
- **Efficient pagination** with skip/limit
- **Optimized aggregation** for statistics
- **Caching strategies** for frequently accessed data

## 🐛 Troubleshooting

### **Database Connection Issues:**
1. Verify MongoDB is running
2. Check connection strings in `.env.local`
3. Test connectivity using admin panel
4. Review console logs for specific errors

### **Authentication Problems:**
1. Ensure `NEXTAUTH_SECRET` is set
2. Clear browser cookies and localStorage
3. Verify user exists in database
4. Check password hashing compatibility

### **Seeding Script Issues:**
1. Ensure both database URIs are valid
2. Check MongoDB permissions
3. Clear existing data if needed
4. Run with `npm run seed` for detailed logs

## 📈 Future Enhancements

- **File attachments** for tickets
- **Email notifications** for ticket updates
- **Advanced reporting** and analytics
- **API rate limiting** and throttling
- **Real-time notifications** with WebSockets
- **Multi-language support** (i18n)
- **Dark mode** theme toggle
- **Advanced user roles** and permissions

## 📄 License

This project is for educational and demonstration purposes. Feel free to use as a reference for your own projects.

---

**Built with ❤️ using Next.js, MongoDB, and modern web technologies.**