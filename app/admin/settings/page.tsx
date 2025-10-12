'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface DatabaseStatus {
  isConnected: boolean;
  currentDatabase: string;
  connectionState: number;
  connectionStates: Record<number, string>;
}

interface DatabaseInfo {
  status: DatabaseStatus;
  primaryUri: string;
  secondaryUri: string;
}

export default function AdminSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [testing, setTesting] = useState<{ primary: boolean; secondary: boolean }>({
    primary: false,
    secondary: false
  });
  const [testResults, setTestResults] = useState<{
    primary?: { success: boolean; error?: string };
    secondary?: { success: boolean; error?: string };
  }>({});
  const [error, setError] = useState('');

  // Redirect if not admin
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [status, session, router]);

  // Fetch database status
  const fetchDatabaseStatus = async () => {
    try {
      const response = await fetch('/api/admin/database');
      const data = await response.json();

      if (response.ok) {
        setDbInfo(data);
      } else {
        setError(data.error || 'Failed to fetch database status');
      }
    } catch {
      setError('Failed to fetch database status');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (session?.user.role === 'admin') {
      fetchDatabaseStatus();
    }
  }, [session]);

  // Test database connection
  const testConnection = async (useSecondary: boolean) => {
    const dbType = useSecondary ? 'secondary' : 'primary';
    setTesting(prev => ({ ...prev, [dbType]: true }));
    setError('');

    try {
      const response = await fetch('/api/admin/database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'test',
          useSecondary
        })
      });

      const data = await response.json();

      if (response.ok) {
        setTestResults(prev => ({
          ...prev,
          [dbType]: data.testResult
        }));
      } else {
        setError(data.error || `Failed to test ${dbType} database`);
      }
    } catch {
      setError(`Failed to test ${dbType} database`);
    } finally {
      setTesting(prev => ({ ...prev, [dbType]: false }));
    }
  };

  // Switch database
  const switchDatabase = async (useSecondary: boolean) => {
    setSwitching(true);
    setError('');

    try {
      const response = await fetch('/api/admin/database', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'switch',
          useSecondary
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Refresh database status
        await fetchDatabaseStatus();
        // Clear test results
        setTestResults({});
      } else {
        setError(data.error || 'Failed to switch database');
      }
    } catch {
      setError('Failed to switch database');
    } finally {
      setSwitching(false);
    }
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
                <div className="h-10 bg-gray-200 rounded w-20 animate-pulse"></div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Skeleton */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Database Management Skeleton */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>

              <div className="space-y-6">
                {/* Current Status Skeleton */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="h-5 bg-gray-200 rounded w-40 mb-3 animate-pulse"></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-16 mb-2 animate-pulse"></div>
                      <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
                    </div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-12 mb-2 animate-pulse"></div>
                      <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                      <div className="h-5 bg-gray-200 rounded w-8 animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Database Controls Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Primary Database Skeleton */}
                  <div className="border rounded-lg p-4">
                    <div className="h-5 bg-gray-200 rounded w-32 mb-3 animate-pulse"></div>
                    <div className="space-y-3">
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-12 mb-2 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                      </div>
                      <div className="flex space-x-2">
                        <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
                        <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
                      </div>
                    </div>
                  </div>

                  {/* Secondary Database Skeleton */}
                  <div className="border rounded-lg p-4">
                    <div className="h-5 bg-gray-200 rounded w-36 mb-3 animate-pulse"></div>
                    <div className="space-y-3">
                      <div>
                        <div className="h-4 bg-gray-200 rounded w-12 mb-2 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                      </div>
                      <div className="flex space-x-2">
                        <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
                        <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Refresh Button Skeleton */}
                <div className="flex justify-center">
                  <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!session || session.user.role !== 'admin') {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
              <p className="text-sm text-gray-600 mt-1">
                Database management and system configuration
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/admin/audit-logs')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Audit Logs
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Dashboard
              </button>
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
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {/* Database Management */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Database Management</h2>
            
            {dbInfo && (
              <div className="space-y-6">
                {/* Current Status */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="text-md font-medium text-gray-900 mb-3">Current Connection Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm text-gray-600">Database:</span>
                      <p className="font-medium capitalize">{dbInfo.status.currentDatabase}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Status:</span>
                      <p className={`font-medium ${dbInfo.status.isConnected ? 'text-green-600' : 'text-red-600'}`}>
                        {dbInfo.status.connectionStates[dbInfo.status.connectionState]}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">State Code:</span>
                      <p className="font-medium">{dbInfo.status.connectionState}</p>
                    </div>
                  </div>
                </div>

                {/* Database Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Primary Database */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Primary Database</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-600">Status:</span>
                        <p className="text-sm">{dbInfo.primaryUri}</p>
                      </div>
                      
                      {testResults.primary && (
                        <div className={`text-sm p-2 rounded ${testResults.primary.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                          {testResults.primary.success ? 'Connection successful' : `Error: ${testResults.primary.error}`}
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => testConnection(false)}
                          disabled={testing.primary}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          {testing.primary ? 'Testing...' : 'Test'}
                        </button>
                        <button
                          onClick={() => switchDatabase(false)}
                          disabled={switching || dbInfo.status.currentDatabase === 'primary'}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          {switching ? 'Switching...' : 'Switch To'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Secondary Database */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Secondary Database</h4>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-600">Status:</span>
                        <p className="text-sm">{dbInfo.secondaryUri}</p>
                      </div>
                      
                      {testResults.secondary && (
                        <div className={`text-sm p-2 rounded ${testResults.secondary.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                          {testResults.secondary.success ? 'Connection successful' : `Error: ${testResults.secondary.error}`}
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => testConnection(true)}
                          disabled={testing.secondary}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          {testing.secondary ? 'Testing...' : 'Test'}
                        </button>
                        <button
                          onClick={() => switchDatabase(true)}
                          disabled={switching || dbInfo.status.currentDatabase === 'secondary'}
                          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          {switching ? 'Switching...' : 'Switch To'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Refresh Button */}
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setRefreshing(true);
                      fetchDatabaseStatus();
                    }}
                    disabled={refreshing}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {refreshing ? 'Refreshing...' : 'Refresh Status'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
