'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { SkeletonCard, SkeletonListItem, SkeletonForm } from '@/components/Skeleton';

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

interface Comment {
  _id: string;
  ticketId: string;
  userId: string;
  userName: string;
  userRole: string;
  content: string;
  createdAt: string;
}

interface HistoryEntry {
  _id: string;
  ticketId: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  description: string;
  createdAt: string;
}

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [activeTab, setActiveTab] = useState<'comments' | 'history'>('comments');
  const [ticketId, setTicketId] = useState<string>('');

  // Resolve params
  useEffect(() => {
    params.then(resolvedParams => {
      setTicketId(resolvedParams.id);
    });
  }, [params]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch ticket data
  const fetchTicket = async () => {
    if (!ticketId) return;
    
    try {
      const response = await fetch(`/api/tickets/${ticketId}`);
      const data = await response.json();
      
      if (response.ok) {
        setTicket(data.ticket);
      } else {
        setError(data.error || 'Failed to fetch ticket');
      }
    } catch {
      setError('Failed to fetch ticket');
    }
  };

  // Fetch comments
  const fetchComments = async () => {
    if (!ticketId) return;
    
    try {
      const response = await fetch(`/api/tickets/${ticketId}/comments`);
      const data = await response.json();
      
      if (response.ok) {
        setComments(data.comments);
      } else {
        console.error('Failed to fetch comments:', data.error);
      }
    } catch {
      console.error('Failed to fetch comments');
    }
  };

  // Fetch history
  const fetchHistory = async () => {
    if (!ticketId) return;
    
    try {
      const response = await fetch(`/api/tickets/${ticketId}/history`);
      const data = await response.json();
      
      if (response.ok) {
        setHistory(data.history);
      } else {
        console.error('Failed to fetch history:', data.error);
      }
    } catch {
      console.error('Failed to fetch history');
    }
  };

  useEffect(() => {
    if (session && ticketId) {
      Promise.all([fetchTicket(), fetchComments(), fetchHistory()])
        .finally(() => setLoading(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, ticketId]);

  // Add comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const response = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: newComment.trim() })
      });

      if (response.ok) {
        setNewComment('');
        fetchComments(); // Refresh comments
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to add comment');
      }
    } catch {
      setError('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Update ticket status (admin only)
  const handleUpdateStatus = async (newStatus: 'open' | 'closed') => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchTicket(); // Refresh ticket
        fetchHistory(); // Refresh history
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update ticket');
      }
    } catch {
      setError('Failed to update ticket');
    }
  };

  // Helper functions
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
              <div className="flex items-center space-x-4">
                <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="h-8 bg-gray-200 rounded w-40 animate-pulse"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
          </div>
        </header>

        {/* Main Content Skeleton */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Ticket Details Skeleton */}
            <SkeletonCard />

            {/* Tabs Skeleton */}
            <div className="bg-white shadow rounded-lg">
              <div className="border-b border-gray-200">
                <div className="flex">
                  <div className="py-2 px-4 border-b-2 border-gray-800">
                    <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
                  </div>
                  <div className="py-2 px-4">
                    <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Comment Form Skeleton */}
                <SkeletonForm />

                {/* Comments List Skeleton */}
                <div className="space-y-4 mt-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                          <div className="h-5 bg-gray-200 rounded w-12 animate-pulse"></div>
                        </div>
                        <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect to login
  }

  if (error && !ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Ticket Details</h1>
            </div>
            <div className="flex space-x-4">
              {session.user.role === 'admin' && ticket && (
                <button
                  onClick={() => handleUpdateStatus(ticket.status === 'open' ? 'closed' : 'open')}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-700"
                >
                  Mark as {ticket.status === 'open' ? 'Closed' : 'Open'}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Ticket Details */}
          {ticket && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{ticket.title}</h2>
                  <div className="flex items-center space-x-2 mb-4">
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
              </div>
              
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Created:</span> {new Date(ticket.createdAt).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Last Updated:</span> {new Date(ticket.updatedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white shadow rounded-lg">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex">
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`py-2 px-4 border-b-2 font-medium text-sm ${
                    activeTab === 'comments'
                      ? 'border-gray-800 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Comments ({comments.length})
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`py-2 px-4 border-b-2 font-medium text-sm ${
                    activeTab === 'history'
                      ? 'border-gray-800 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  History ({history.length})
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'comments' && (
                <div>
                  {/* Add Comment Form */}
                  <form onSubmit={handleAddComment} className="mb-6">
                    <div className="mb-4">
                      <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                        Add Comment
                      </label>
                      <textarea
                        id="comment"
                        rows={3}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        maxLength={1000}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-500"
                        placeholder="Enter your comment..."
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {newComment.length}/1000 characters
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={submittingComment || !newComment.trim()}
                      className="px-4 py-2 text-sm font-medium text-white bg-gray-800 rounded-md hover:bg-gray-700 disabled:opacity-50"
                    >
                      {submittingComment ? 'Adding...' : 'Add Comment'}
                    </button>
                  </form>

                  {/* Comments List */}
                  <div className="space-y-4">
                    {comments.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No comments yet. Be the first to comment!</p>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment._id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">{comment.userName}</span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                comment.userRole === 'admin' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {comment.userRole}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-4">
                  {history.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No history available.</p>
                  ) : (
                    history.map((entry) => (
                      <div key={entry._id} className="border-l-4 border-gray-200 pl-4 py-2">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{entry.userName}</span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              entry.userRole === 'admin' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {entry.userRole}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(entry.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{entry.description}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
