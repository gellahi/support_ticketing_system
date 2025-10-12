import mongoose, { Document, Schema } from 'mongoose';

export interface ITicketHistory extends Document {
  _id: string;
  ticketId: string;
  userId: string;
  userName: string;
  userRole: string;
  action: 'created' | 'updated' | 'status_changed' | 'priority_changed' | 'category_changed' | 'commented';
  field?: string;
  oldValue?: string;
  newValue?: string;
  description: string;
  createdAt: Date;
}

const TicketHistorySchema = new Schema<ITicketHistory>({
  ticketId: {
    type: String,
    required: [true, 'Ticket ID is required'],
    ref: 'Ticket'
  },
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    ref: 'User'
  },
  userName: {
    type: String,
    required: [true, 'User name is required'],
    trim: true
  },
  userRole: {
    type: String,
    required: [true, 'User role is required'],
    enum: ['user', 'admin']
  },
  action: {
    type: String,
    required: [true, 'Action is required'],
    enum: ['created', 'updated', 'status_changed', 'priority_changed', 'category_changed', 'commented']
  },
  field: {
    type: String,
    trim: true
  },
  oldValue: {
    type: String,
    trim: true
  },
  newValue: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

// Index for efficient queries
TicketHistorySchema.index({ ticketId: 1, createdAt: -1 });
TicketHistorySchema.index({ userId: 1 });

// Prevent re-compilation during development
const TicketHistory = mongoose.models.TicketHistory || mongoose.model<ITicketHistory>('TicketHistory', TicketHistorySchema);

export default TicketHistory;
