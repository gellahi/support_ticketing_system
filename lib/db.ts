import mongoose from 'mongoose';

// Global connection cache to prevent multiple connections
declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var mongoose: { conn: any; promise: any } | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Database connection utility with automatic failover
 * Connects to primary DB by default, falls back to secondary if primary fails
 */
async function dbConnect() {
  // Return existing connection if available
  if (cached?.conn) {
    return cached.conn;
  }

  // If no existing promise, create new connection
  if (!cached?.promise) {
    const opts = {
      bufferCommands: false,
    };

    // Determine which database to use
    const useSecondary = process.env.USE_SECONDARY_DB === 'true';
    const primaryUri = process.env.PRIMARY_DB_URI;
    const secondaryUri = process.env.SECONDARY_DB_URI;

    if (!primaryUri || !secondaryUri) {
      throw new Error('Database URIs are not configured in environment variables');
    }

    const connectionUri = useSecondary ? secondaryUri : primaryUri;
    const dbName = useSecondary ? 'secondary' : 'primary';

    console.log(`Attempting to connect to ${dbName} database...`);

    try {
      // Try to connect to the selected database
      cached!.promise = mongoose.connect(connectionUri, opts);
      console.log(`Successfully connected to ${dbName} database`);
    } catch (error) {
      console.error(`Failed to connect to ${dbName} database:`, error);

      // If primary fails and we weren't already using secondary, try secondary
      if (!useSecondary) {
        console.log('Attempting failover to secondary database...');
        try {
          cached!.promise = mongoose.connect(secondaryUri, opts);
          console.log('Successfully connected to secondary database (failover)');
        } catch (secondaryError) {
          console.error('Failed to connect to secondary database:', secondaryError);
          throw new Error('Both primary and secondary database connections failed');
        }
      } else {
        throw error;
      }
    }
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}

/**
 * Get current database connection status
 */
export function getConnectionStatus() {
  const useSecondary = process.env.USE_SECONDARY_DB === 'true';
  return {
    isConnected: mongoose.connection.readyState === 1,
    currentDatabase: useSecondary ? 'secondary' : 'primary',
    connectionState: mongoose.connection.readyState
  };
}

/**
 * Disconnect from database
 */
export async function dbDisconnect() {
  if (cached?.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
  }
}

export default dbConnect;
