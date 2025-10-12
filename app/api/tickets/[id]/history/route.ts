import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Ticket from '@/models/Ticket';
import TicketHistory from '@/models/TicketHistory';
import dbConnect from '@/lib/db';

// GET /api/tickets/[id]/history - Get history for a ticket
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

    // Access control: users can only see history of their own tickets, admins can see all
    if (session.user.role !== 'admin' && ticket.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get ticket history
    const history = await TicketHistory.find({ ticketId: resolvedParams.id })
      .sort({ createdAt: -1 });

    return NextResponse.json({ history });

  } catch (error) {
    console.error('Error fetching ticket history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
