import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Ticket from '@/models/Ticket';
import dbConnect from '@/lib/db';
import { createAuditLog, getRequestInfo } from '@/lib/audit';

// PUT /api/tickets/[id] - Update ticket (status change, admin only for now)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status } = await request.json();

    if (!status || !['open', 'closed'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status (open/closed) is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Await params since they're now async in Next.js 15
    const resolvedParams = await params;

    // Find the ticket
    const ticket = await Ticket.findById(resolvedParams.id);
    
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Access control: users can only update their own tickets, admins can update any
    if (session.user.role !== 'admin' && ticket.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update ticket
    ticket.status = status;
    await ticket.save();

    // Create audit log
    const requestInfo = getRequestInfo(request);
    await createAuditLog({
      who: session.user.id,
      what: 'update_ticket',
      details: `Updated ticket ${ticket.title} status to ${status}`,
      ...requestInfo
    });

    return NextResponse.json({ 
      message: 'Ticket updated successfully',
      ticket 
    });

  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/tickets/[id] - Delete ticket
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Await params since they're now async in Next.js 15
    const resolvedParams = await params;

    // Find the ticket
    const ticket = await Ticket.findById(resolvedParams.id);
    
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Access control: users can only delete their own tickets, admins can delete any
    if (session.user.role !== 'admin' && ticket.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Store ticket info for audit log before deletion
    const ticketTitle = ticket.title;

    // Delete ticket
    await Ticket.findByIdAndDelete(resolvedParams.id);

    // Create audit log
    const requestInfo = getRequestInfo(request);
    await createAuditLog({
      who: session.user.id,
      what: 'delete_ticket',
      details: `Deleted ticket: ${ticketTitle}`,
      ...requestInfo
    });

    return NextResponse.json({ 
      message: 'Ticket deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting ticket:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
