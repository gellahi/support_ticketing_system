import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Ticket from '@/models/Ticket';
import dbConnect from '@/lib/db';
import { createAuditLog, getRequestInfo } from '@/lib/audit';

// GET /api/tickets - Get tickets (user sees only their tickets, admin sees all)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    let tickets;
    if (session.user.role === 'admin') {
      // Admin can see all tickets
      tickets = await Ticket.find({}).sort({ createdAt: -1 });
    } else {
      // Regular users can only see their own tickets
      tickets = await Ticket.find({ userId: session.user.id }).sort({ createdAt: -1 });
    }

    // Create audit log
    const requestInfo = getRequestInfo(request);
    await createAuditLog({
      who: session.user.id,
      what: 'view_tickets',
      details: `User viewed ${tickets.length} tickets`,
      ...requestInfo
    });

    return NextResponse.json({ tickets });

  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/tickets - Create a new ticket
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description } = await request.json();

    // Validation
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    if (title.length > 200) {
      return NextResponse.json(
        { error: 'Title cannot exceed 200 characters' },
        { status: 400 }
      );
    }

    if (description.length > 2000) {
      return NextResponse.json(
        { error: 'Description cannot exceed 2000 characters' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Create ticket
    const ticket = new Ticket({
      title: title.trim(),
      description: description.trim(),
      userId: session.user.id,
      status: 'open'
    });

    await ticket.save();

    // Create audit log
    const requestInfo = getRequestInfo(request);
    await createAuditLog({
      who: session.user.id,
      what: 'create_ticket',
      details: `Created ticket: ${ticket.title}`,
      ...requestInfo
    });

    return NextResponse.json({ 
      message: 'Ticket created successfully',
      ticket 
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
