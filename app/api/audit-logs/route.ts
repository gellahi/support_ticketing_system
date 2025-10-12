import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAuditLogs, createAuditLog, getRequestInfo } from '@/lib/audit';

// GET /api/audit-logs - Get audit logs (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can view audit logs
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    // Fetch audit logs
    const result = await getAuditLogs(limit, skip);

    // Create audit log for viewing audit logs
    const requestInfo = getRequestInfo(request);
    await createAuditLog({
      who: session.user.id,
      what: 'view_audit_logs',
      details: `Admin viewed audit logs (${result.logs.length} entries)`,
      ...requestInfo
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
