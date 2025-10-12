'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { SkeletonStats, SkeletonListItem } from '@/components/Skeleton';
import { ConfirmDialog } from '@/components/Dialog';
import { useToast } from '@/components/Toast';

interface Ticket {
  _id: string;
  title: string;
  description: string;
  status: 'open' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'billing' | 'general' | 'feature_request' | 'bug_report';
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface TicketStats {
  total: number;
  open: number;
  closed: number;
  byPriority: Record<string, number>;
  byCategory: Record<string, number>;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function EnhancedDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { addToast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    category: 'general' as 'technical' | 'billing' | 'general' | 'feature_request' | 'bug_report'
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; ticketId: string; ticketTitle: string }>({
    isOpen: false,
    ticketId: '',
    ticketTitle: ''
  });
  
  // Filter and search states
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    category: 'all',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 1,
    limit: 10
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch tickets with filters
  const fetchTickets = async () => {
    try {
      setTicketsLoading(true);

      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/tickets?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setTickets(data.tickets);
        setStats(data.stats);
        setPagination(data.pagination);
      } else {
        setError(data.error || 'Failed to fetch tickets');
      }
    } catch {
      setError('Failed to fetch tickets');
    } finally {
      setTicketsLoading(false);
    }
  };

  useEffect(() => {
    if (session && status === 'authenticated') {
      fetchTickets();
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, filters, status]);

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  // Handle search
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchTerm = formData.get('search') as string;
    setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Create ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setFormData({ title: '', description: '', priority: 'medium', category: 'general' });
        setShowCreateForm(false);
        fetchTickets(); // Refresh tickets
        addToast({
          type: 'success',
          title: 'Ticket Created',
          message: 'Your ticket has been created successfully.'
        });
      } else {
        setError(data.error || 'Failed to create ticket');
        addToast({
          type: 'error',
          title: 'Failed to Create Ticket',
          message: data.error || 'An error occurred while creating the ticket.'
        });
      }
    } catch {
      setError('Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete ticket
  const handleDeleteTicket = (ticketId: string) => {
    const ticket = tickets.find(t => t._id === ticketId);
    setDeleteDialog({
      isOpen: true,
      ticketId,
      ticketTitle: ticket?.title || 'this ticket'
    });
  };

  const confirmDeleteTicket = async () => {
    try {
      const response = await fetch(`/api/tickets/${deleteDialog.ticketId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchTickets(); // Refresh tickets
        setDeleteDialog({ isOpen: false, ticketId: '', ticketTitle: '' });
        addToast({
          type: 'success',
          title: 'Ticket Deleted',
          message: 'The ticket has been deleted successfully.'
        });
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete ticket');
        setDeleteDialog({ isOpen: false, ticketId: '', ticketTitle: '' });
        addToast({
          type: 'error',
          title: 'Failed to Delete Ticket',
          message: data.error || 'An error occurred while deleting the ticket.'
        });
      }
    } catch {
      setError('Failed to delete ticket');
      setDeleteDialog({ isOpen: false, ticketId: '', ticketTitle: '' });
    }
  };

  // Update ticket status (admin only)
  const handleUpdateStatus = async (ticketId: string, newStatus: 'open' | 'closed') => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchTickets(); // Refresh tickets
        addToast({
          type: 'success',
          title: 'Ticket Status Updated',
          message: `Ticket status has been changed to ${newStatus}.`
        });
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update ticket');
        addToast({
          type: 'error',
          title: 'Failed to Update Status',
          message: data.error || 'An error occurred while updating the ticket status.'
        });
      }
    } catch {
      setError('Failed to update ticket');
    }
  };

  // Helper functions for display
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical': return 'bg-blue-100 text-blue-800';
      case 'billing': return 'bg-purple-100 text-purple-800';
      case 'feature_request': return 'bg-indigo-100 text-indigo-800';
      case 'bug_report': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCategory = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
              </div>
              <div className="flex space-x-4">
                <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded w-20 animate-pulse"></div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Skeleton */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Stats Skeleton */}
            <SkeletonStats />

            {/* Filters Skeleton */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-4">
                  <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded w-28 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded w-36 animate-pulse"></div>
                </div>
                <div className="flex gap-2">
                  <div className="h-10 bg-gray-200 rounded w-64 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded w-16 animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Create Button Skeleton */}
            <div className="mb-6">
              <div className="h-10 bg-gray-200 rounded w-40 animate-pulse"></div>
            </div>

            {/* Tickets List Skeleton */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:px-6">
                <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
              </div>
              <ul className="divide-y divide-gray-200">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonListItem key={i} />
                ))}
              </ul>
            </div>
          </div>
        </main>
  
        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={deleteDialog.isOpen}
          onClose={() => setDeleteDialog({ isOpen: false, ticketId: '', ticketTitle: '' })}
          onConfirm={confirmDeleteTicket}
          title="Delete Ticket"
          message={`Are you sure you want to delete "${deleteDialog.ticketTitle}"? This action cannot be undone.`}
          confirmText="Delete"
          confirmVariant="danger"
        />
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome, {session.user.name} ({session.user.role})
              </p>
            </div>
            <div className="flex space-x-4">
              {session.user.role === 'admin' && (
                <>
                  <button
                    onClick={() => router.push('/admin/settings')}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Admin Settings
                  </button>
                  <button
                    onClick={() => router.push('/admin/audit-logs')}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Audit Logs
                  </button>
                </>
              )}
              <button
                onClick={() => router.push('/api/auth/signout')}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Statistics Cards */}
          {stats ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Total Tickets</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Open Tickets</h3>
                <p className="text-2xl font-bold text-green-600">{stats.open}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Closed Tickets</h3>
                <p className="text-2xl font-bold text-gray-600">{stats.closed}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Urgent Tickets</h3>
                <p className="text-2xl font-bold text-red-600">{stats.byPriority.urgent || 0}</p>
              </div>
            </div>
          ) : (
            <SkeletonStats />
          )}

          {/* Filters and Search */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4">
                {/* Status Filter */}
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>

                {/* Priority Filter */}
                <select
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                {/* Category Filter */}
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All Categories</option>
                  <option value="technical">Technical</option>
                  <option value="billing">Billing</option>
                  <option value="general">General</option>
                  <option value="feature_request">Feature Request</option>
                  <option value="bug_report">Bug Report</option>
                </select>

                {/* Sort Options */}
                <select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-');
                    setFilters(prev => ({ ...prev, sortBy, sortOrder, page: 1 }));
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="title-asc">Title A-Z</option>
                  <option value="title-desc">Title Z-A</option>
                  <option value="priority-desc">Priority High-Low</option>
                  <option value="status-asc">Status</option>
                </select>
              </div>

              {/* Search */}
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  name="search"
                  type="text"
                  placeholder="Search tickets..."
                  defaultValue={filters.search}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm w-64"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-800 text-white rounded-md text-sm hover:bg-gray-700"
                >
                  Search
                </button>
              </form>
            </div>
          </div>

          {/* Create Ticket Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-700"
            >
              {showCreateForm ? 'Cancel' : 'Create New Ticket'}
            </button>
          </div>

          {/* Create Ticket Form */}
          {showCreateForm && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Create New Ticket</h2>
              <form onSubmit={handleCreateTicket} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      maxLength={200}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                      placeholder="Enter ticket title"
                    />
                  </div>
                  <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                      Priority
                    </label>
                    <select
                      id="priority"
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' | 'urgent' })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as 'technical' | 'billing' | 'general' | 'feature_request' | 'bug_report' })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                  >
                    <option value="general">General</option>
                    <option value="technical">Technical</option>
                    <option value="billing">Billing</option>
                    <option value="feature_request">Feature Request</option>
                    <option value="bug_report">Bug Report</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    maxLength={2000}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                    placeholder="Describe your issue"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-700 disabled:opacity-50"
                  >
                    {submitting ? 'Creating...' : 'Create Ticket'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Tickets List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Tickets ({pagination?.totalCount || 0})
              </h3>
              {pagination && (
                <div className="text-sm text-gray-500">
                  Page {pagination.page} of {pagination.totalPages}
                </div>
              )}
            </div>
            {ticketsLoading ? (
              <ul className="divide-y divide-gray-200">
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonListItem key={i} />
                ))}
              </ul>
            ) : tickets.length === 0 ? (
              <div className="px-4 py-5 sm:px-6 text-center text-gray-500">
                No tickets found. {filters.search || filters.status !== 'all' || filters.priority !== 'all' || filters.category !== 'all' ? 'Try adjusting your filters.' : 'Create your first ticket above.'}
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {tickets.map((ticket) => (
                  <li key={ticket._id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-medium text-gray-900">
                            <button
                              onClick={() => router.push(`/tickets/${ticket._id}`)}
                              className="hover:text-blue-600 text-left"
                            >
                              {ticket.title}
                            </button>
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority.toUpperCase()}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(ticket.category)}`}>
                              {formatCategory(ticket.category)}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              ticket.status === 'open'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {ticket.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">{ticket.description}</p>
                        <p className="mt-2 text-xs text-gray-500">
                          Created: {new Date(ticket.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex space-x-2">
                      {session.user.role === 'admin' && (
                        <button
                          onClick={() => handleUpdateStatus(ticket._id, ticket.status === 'open' ? 'closed' : 'open')}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Mark as {ticket.status === 'open' ? 'Closed' : 'Open'}
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteTicket(ticket._id)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} results
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.hasPrev}
                      className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, pagination.page - 2) + i;
                      if (pageNum > pagination.totalPages) return null;

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 text-sm rounded-md ${
                            pageNum === pagination.page
                              ? 'bg-gray-800 text-white'
                              : 'bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasNext}
                      className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, ticketId: '', ticketTitle: '' })}
        onConfirm={confirmDeleteTicket}
        title="Delete Ticket"
        message={`Are you sure you want to delete "${deleteDialog.ticketTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
}
