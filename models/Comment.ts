import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
  _id: string;
  ticketId: string;
  userId: string;
  userName: string;
  userRole: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>({
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
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Index for efficient queries
CommentSchema.index({ ticketId: 1, createdAt: -1 });
CommentSchema.index({ userId: 1 });

// Prevent re-compilation during development
const Comment = mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);

export default Comment;
