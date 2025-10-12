import AuditLog from '@/models/AuditLog';
import dbConnect from './db';

export type AuditAction = 
  | 'login'
  | 'logout'
  | 'register'
  | 'create_ticket'
  | 'update_ticket'
  | 'delete_ticket'
  | 'view_tickets'
  | 'view_audit_logs';

interface AuditLogData {
  who: string;
  what: AuditAction;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry
 * This is append-only and should never fail silently
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await dbConnect();
    
    const auditEntry = new AuditLog({
      who: data.who,
      what: data.what,
      when: new Date(),
      details: data.details,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent
    });

    await auditEntry.save();
    console.log(`Audit log created: ${data.who} performed ${data.what}`);
  } catch (error) {
    // Log error but don't throw - audit logging should not break the main flow
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Get audit logs (admin only)
 */
export async function getAuditLogs(limit: number = 100, skip: number = 0) {
  try {
    await dbConnect();
    
    const logs = await AuditLog.find({})
      .sort({ when: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await AuditLog.countDocuments({});

    return {
      logs,
      total,
      hasMore: skip + limit < total
    };
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    throw new Error('Failed to fetch audit logs');
  }
}

/**
 * Helper to extract request info for audit logging
 */
export function getRequestInfo(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ipAddress = forwarded ? forwarded.split(',')[0] : 
                   request.headers.get('x-real-ip') || 
                   'unknown';
  
  const userAgent = request.headers.get('user-agent') || 'unknown';

  return { ipAddress, userAgent };
}
