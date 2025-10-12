import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  _id: string;
  who: string; // user id or role
  what: string; // action performed
  when: Date; // timestamp
  details?: string; // optional additional details
  ipAddress?: string; // optional IP address
  userAgent?: string; // optional user agent
}

const AuditLogSchema = new Schema<IAuditLog>({
  who: {
    type: String,
    required: [true, 'Who field is required'],
    trim: true
  },
  what: {
    type: String,
    required: [true, 'What field is required'],
    trim: true,
    enum: [
      'login',
      'logout',
      'register',
      'create_ticket',
      'update_ticket',
      'delete_ticket',
      'view_tickets',
      'view_audit_logs'
    ]
  },
  when: {
    type: Date,
    required: true,
    default: Date.now
  },
  details: {
    type: String,
    trim: true,
    maxlength: [500, 'Details cannot exceed 500 characters']
  },
  ipAddress: {
    type: String,
    trim: true
  },
  userAgent: {
    type: String,
    trim: true
  }
}, {
  // Disable automatic timestamps since we have custom 'when' field
  timestamps: false
});

// Index for efficient queries
AuditLogSchema.index({ when: -1 });
AuditLogSchema.index({ who: 1 });
AuditLogSchema.index({ what: 1 });

// Prevent re-compilation during development
const AuditLog = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);

export default AuditLog;
