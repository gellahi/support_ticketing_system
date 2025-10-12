import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Ticket from '@/models/Ticket';
import TicketHistory from '@/models/TicketHistory';
import dbConnect from '@/lib/db';
import { createAuditLog, getRequestInfo } from '@/lib/audit';

// GET /api/tickets - Get tickets with filtering, sorting, and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build query
    const query: Record<string, unknown> = {};

    // Access control: users can only see their own tickets
    if (session.user.role !== 'admin') {
      query.userId = session.user.id;
    }

    // Apply filters
    if (status && status !== 'all') {
      query.status = status;
    }
    if (priority && priority !== 'all') {
      query.priority = priority;
    }
    if (category && category !== 'all') {
      query.category = category;
    }
    if (search) {
      query.$text = { $search: search };
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const [tickets, totalCount] = await Promise.all([
      Ticket.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Ticket.countDocuments(query)
    ]);

    // Get statistics
    const stats = await getTicketStats(session.user.role === 'admin' ? {} : { userId: session.user.id });

    // Create audit log
    const requestInfo = getRequestInfo(request);
    await createAuditLog({
      who: session.user.id,
      what: 'view_tickets',
      details: `User viewed ${tickets.length} tickets (page ${page})`,
      ...requestInfo
    });

    return NextResponse.json({
      tickets,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      },
      stats
    });

  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to get ticket statistics
async function getTicketStats(baseQuery: Record<string, unknown> = {}) {
  const [
    totalTickets,
    openTickets,
    closedTickets,
    priorityStats,
    categoryStats
  ] = await Promise.all([
    Ticket.countDocuments(baseQuery),
    Ticket.countDocuments({ ...baseQuery, status: 'open' }),
    Ticket.countDocuments({ ...baseQuery, status: 'closed' }),
    Ticket.aggregate([
      { $match: baseQuery },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]),
    Ticket.aggregate([
      { $match: baseQuery },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ])
  ]);

  return {
    total: totalTickets,
    open: openTickets,
    closed: closedTickets,
    byPriority: priorityStats.reduce((acc: Record<string, number>, item: { _id: string; count: number }) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    byCategory: categoryStats.reduce((acc: Record<string, number>, item: { _id: string; count: number }) => {
      acc[item._id] = item.count;
      return acc;
    }, {})
  };
}

// POST /api/tickets - Create a new ticket
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, priority, category } = await request.json();

    // Validation
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority. Must be one of: low, medium, high, urgent' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['technical', 'billing', 'general', 'feature_request', 'bug_report'];
    if (category && !validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category. Must be one of: technical, billing, general, feature_request, bug_report' },
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
      priority: priority || 'medium',
      category: category || 'general',
      userId: session.user.id,
      status: 'open'
    });

    await ticket.save();

    // Create initial history entry
    const history = new TicketHistory({
      ticketId: ticket._id.toString(),
      userId: session.user.id,
      userName: session.user.name,
      userRole: session.user.role,
      action: 'created',
      description: `Created ticket with priority: ${ticket.priority}, category: ${ticket.category}`
    });
    await history.save();

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
