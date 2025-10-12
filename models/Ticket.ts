import mongoose, { Document, Schema } from 'mongoose';

export interface ITicket extends Document {
  _id: string;
  title: string;
  description: string;
  status: 'open' | 'closed';
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema = new Schema<ITicket>({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open'
  },
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for efficient queries by user
TicketSchema.index({ userId: 1 });
TicketSchema.index({ status: 1 });
TicketSchema.index({ createdAt: -1 });

// Prevent re-compilation during development
const Ticket = mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', TicketSchema);

export default Ticket;
