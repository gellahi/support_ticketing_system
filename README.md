# Support Ticketing System

A complete and secure support ticketing system built with Next.js, featuring dual database support, role-based access control, and comprehensive audit logging.

## Features

- **Authentication & Authorization**: NextAuth.js with role-based access (admin/user)
- **Ticket Management**: Create, view, update, and delete support tickets
- **Access Control**: Users see only their tickets, admins see all tickets
- **Dual Database Support**: Primary/secondary MongoDB instances with automatic failover
- **Audit Logging**: Comprehensive logging of all critical actions
- **Clean UI**: Minimal, modern interface built with TailwindCSS

## Tech Stack

- **Frontend & Backend**: Next.js 15 with App Router
- **Styling**: TailwindCSS
- **Database**: MongoDB with Mongoose ORM
- **Authentication**: NextAuth.js with credentials provider
- **Password Hashing**: bcrypt
- **TypeScript**: Full type safety

## Setup Instructions

### 1. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production

# MongoDB Configuration
# Primary database connection
PRIMARY_DB_URI=mongodb://localhost:27017/ticketing_system_primary

# Secondary database connection (for failover)
SECONDARY_DB_URI=mongodb://localhost:27017/ticketing_system_secondary

# Database failover configuration
# Set to 'true' to simulate primary database failure and use secondary
USE_SECONDARY_DB=false
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start MongoDB

Make sure you have MongoDB running locally on port 27017, or update the connection strings to point to your MongoDB instances.

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage Guide

### Initial Setup

1. **First Visit**: You'll be redirected to the login page
2. **Create Account**: Click "Don't have an account? Sign up" to register
3. **Login**: Use your credentials to sign in
4. **Dashboard**: You'll be redirected to the ticket management dashboard

### User Roles

- **Regular User**: Can create, view, and delete their own tickets
- **Admin**: Can view and manage all tickets, access audit logs

### Creating an Admin User

To create an admin user, you'll need to manually update the user's role in the database:

1. Register a new user through the UI
2. Connect to your MongoDB database
3. Update the user's role:
   ```javascript
   db.users.updateOne(
     { email: "admin@example.com" },
     { $set: { role: "admin" } }
   )
   ```

## Database Failover Simulation

The system supports automatic failover between primary and secondary databases:

### Method 1: Environment Variable
Set `USE_SECONDARY_DB=true` in your `.env.local` file and restart the application.

### Method 2: Runtime Simulation
The system will automatically attempt to connect to the secondary database if the primary connection fails.

### Testing Failover
1. Start with both databases running
2. Stop the primary database
3. The application should automatically switch to the secondary database
4. All operations will continue normally using the secondary database

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/           # Authentication routes
│   │   ├── tickets/        # Ticket management API
│   │   └── audit-logs/     # Audit log API (admin only)
│   ├── dashboard/          # Main ticket dashboard
│   ├── login/              # Login/signup page
│   └── admin/
│       └── audit-logs/     # Admin audit log viewer
├── components/
│   └── AuthProvider.tsx    # NextAuth session provider
├── lib/
│   ├── auth.ts            # NextAuth configuration
│   ├── db.ts              # Database connection with failover
│   └── audit.ts           # Audit logging utilities
├── models/
│   ├── User.ts            # User model
│   ├── Ticket.ts          # Ticket model
│   └── AuditLog.ts        # Audit log model
├── types/
│   └── next-auth.d.ts     # NextAuth type definitions
└── middleware.ts          # Route protection middleware
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/signin` - User login (NextAuth)
- `POST /api/auth/signout` - User logout (NextAuth)

### Tickets
- `GET /api/tickets` - Get tickets (filtered by user role)
- `POST /api/tickets` - Create new ticket
- `PUT /api/tickets/[id]` - Update ticket status
- `DELETE /api/tickets/[id]` - Delete ticket

### Audit Logs (Admin Only)
- `GET /api/audit-logs` - Get audit logs with pagination

## Security Features

- **Password Hashing**: bcrypt with 12 salt rounds
- **Route Protection**: Middleware-based authentication
- **Role-based Access**: Enforced at API level
- **Audit Logging**: All critical actions logged
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Prevention**: Mongoose ORM protection

## Deployment

This application is ready for deployment on Vercel:

1. Push your code to a Git repository
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

Make sure to:
- Use production MongoDB URIs
- Generate a secure `NEXTAUTH_SECRET`
- Set the correct `NEXTAUTH_URL`

## Development Notes

- The application uses Next.js App Router for both frontend and backend
- All API routes include proper error handling and validation
- Audit logs are append-only for security
- Database connections are cached to prevent connection exhaustion
- TypeScript provides full type safety throughout the application
