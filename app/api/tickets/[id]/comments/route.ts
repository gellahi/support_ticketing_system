import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Comment from '@/models/Comment';
import Ticket from '@/models/Ticket';
import TicketHistory from '@/models/TicketHistory';
import dbConnect from '@/lib/db';
import { createAuditLog, getRequestInfo } from '@/lib/audit';

// GET /api/tickets/[id]/comments - Get comments for a ticket
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const resolvedParams = await params;

    // Check if ticket exists and user has access
    const ticket = await Ticket.findById(resolvedParams.id);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Access control: users can only see comments on their own tickets, admins can see all
    if (session.user.role !== 'admin' && ticket.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get comments
    const comments = await Comment.find({ ticketId: resolvedParams.id })
      .sort({ createdAt: 1 });

    return NextResponse.json({ comments });

  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/tickets/[id]/comments - Add a comment to a ticket
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: 'Comment cannot exceed 1000 characters' },
        { status: 400 }
      );
    }

    await dbConnect();
    const resolvedParams = await params;

    // Check if ticket exists and user has access
    const ticket = await Ticket.findById(resolvedParams.id);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Access control: users can only comment on their own tickets, admins can comment on any
    if (session.user.role !== 'admin' && ticket.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Create comment
    const comment = new Comment({
      ticketId: resolvedParams.id,
      userId: session.user.id,
      userName: session.user.name,
      userRole: session.user.role,
      content: content.trim()
    });

    await comment.save();

    // Create ticket history entry
    const history = new TicketHistory({
      ticketId: resolvedParams.id,
      userId: session.user.id,
      userName: session.user.name,
      userRole: session.user.role,
      action: 'commented',
      description: `Added a comment: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`
    });

    await history.save();

    // Create audit log
    const requestInfo = getRequestInfo(request);
    await createAuditLog({
      who: session.user.id,
      what: 'create_ticket', // Using existing enum value
      details: `Added comment to ticket: ${ticket.title}`,
      ...requestInfo
    });

    return NextResponse.json({ 
      message: 'Comment added successfully',
      comment 
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
