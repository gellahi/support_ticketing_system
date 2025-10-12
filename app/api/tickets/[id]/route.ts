import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Ticket from '@/models/Ticket';
import TicketHistory from '@/models/TicketHistory';
import dbConnect from '@/lib/db';
import { createAuditLog, getRequestInfo } from '@/lib/audit';

// GET /api/tickets/[id] - Get a specific ticket
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

    // Find the ticket
    const ticket = await Ticket.findById(resolvedParams.id);

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Access control: users can only view their own tickets, admins can view all
    if (session.user.role !== 'admin' && ticket.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ ticket });

  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const { status, priority, category } = await request.json();

    // Validation
    if (status && !['open', 'closed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "open" or "closed"' },
        { status: 400 }
      );
    }

    if (priority && !['low', 'medium', 'high', 'urgent'].includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority. Must be one of: low, medium, high, urgent' },
        { status: 400 }
      );
    }

    if (category && !['technical', 'billing', 'general', 'feature_request', 'bug_report'].includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category. Must be one of: technical, billing, general, feature_request, bug_report' },
        { status: 400 }
      );
    }

    // At least one field must be provided
    if (!status && !priority && !category) {
      return NextResponse.json(
        { error: 'At least one field (status, priority, or category) must be provided' },
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

    // Access control: only admins can update ticket status, priority, and category
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Track changes for history
    const changes: Array<{field: string, oldValue: string, newValue: string}> = [];

    if (status && status !== ticket.status) {
      changes.push({
        field: 'status',
        oldValue: ticket.status,
        newValue: status
      });
      ticket.status = status;
    }

    if (priority && priority !== ticket.priority) {
      changes.push({
        field: 'priority',
        oldValue: ticket.priority,
        newValue: priority
      });
      ticket.priority = priority;
    }

    if (category && category !== ticket.category) {
      changes.push({
        field: 'category',
        oldValue: ticket.category,
        newValue: category
      });
      ticket.category = category;
    }

    // Save ticket if there are changes
    if (changes.length > 0) {
      await ticket.save();

      // Create history entries for each change
      for (const change of changes) {
        const history = new TicketHistory({
          ticketId: ticket._id.toString(),
          userId: session.user.id,
          userName: session.user.name,
          userRole: session.user.role,
          action: `${change.field}_changed` as 'status_changed' | 'priority_changed' | 'category_changed',
          field: change.field,
          oldValue: change.oldValue,
          newValue: change.newValue,
          description: `Changed ${change.field} from "${change.oldValue}" to "${change.newValue}"`
        });
        await history.save();
      }

      // Create audit log
      const requestInfo = getRequestInfo(request);
      await createAuditLog({
        who: session.user.id,
        what: 'update_ticket',
        details: `Updated ticket: ${changes.map(c => `${c.field} to ${c.newValue}`).join(', ')} - ${ticket.title}`,
        ...requestInfo
      });
    }

    return NextResponse.json({
      message: 'Ticket updated successfully',
      ticket,
      changes: changes.length
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
