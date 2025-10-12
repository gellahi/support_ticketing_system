import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getConnectionStatus, switchDatabase, testDatabaseConnection } from '@/lib/db';
import { createAuditLog, getRequestInfo } from '@/lib/audit';

// GET /api/admin/database - Get current database status
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can access database management
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const status = getConnectionStatus();
    
    return NextResponse.json({
      status,
      primaryUri: process.env.PRIMARY_DB_URI ? 'configured' : 'not configured',
      secondaryUri: process.env.SECONDARY_DB_URI ? 'configured' : 'not configured'
    });

  } catch (error) {
    console.error('Error getting database status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/database - Switch database or test connection
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can manage database connections
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { action, useSecondary } = await request.json();

    if (!action || typeof useSecondary !== 'boolean') {
      return NextResponse.json(
        { error: 'Action and useSecondary parameters are required' },
        { status: 400 }
      );
    }

    const requestInfo = getRequestInfo(request);

    if (action === 'test') {
      // Test database connection without switching
      const testResult = await testDatabaseConnection(useSecondary);
      
      await createAuditLog({
        who: session.user.id,
        what: 'view_audit_logs', // Using existing enum value
        details: `Tested ${useSecondary ? 'secondary' : 'primary'} database connection: ${testResult.success ? 'success' : 'failed'}`,
        ...requestInfo
      });

      return NextResponse.json({ testResult });

    } else if (action === 'switch') {
      // Switch to the specified database
      const currentStatus = getConnectionStatus();
      const targetDb = useSecondary ? 'secondary' : 'primary';
      
      if (currentStatus.currentDatabase === targetDb) {
        return NextResponse.json({
          message: `Already connected to ${targetDb} database`,
          status: currentStatus
        });
      }

      try {
        await switchDatabase(useSecondary);
        const newStatus = getConnectionStatus();

        await createAuditLog({
          who: session.user.id,
          what: 'view_audit_logs', // Using existing enum value  
          details: `Switched database from ${currentStatus.currentDatabase} to ${newStatus.currentDatabase}`,
          ...requestInfo
        });

        return NextResponse.json({
          message: `Successfully switched to ${targetDb} database`,
          status: newStatus
        });

      } catch (error) {
        await createAuditLog({
          who: session.user.id,
          what: 'view_audit_logs', // Using existing enum value
          details: `Failed to switch to ${targetDb} database: ${error instanceof Error ? error.message : 'Unknown error'}`,
          ...requestInfo
        });

        return NextResponse.json(
          { error: `Failed to switch to ${targetDb} database` },
          { status: 500 }
        );
      }

    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "test" or "switch"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error managing database:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
