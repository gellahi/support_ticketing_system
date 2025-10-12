import mongoose from 'mongoose';

// Global connection cache to prevent multiple connections
declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var mongoose: { conn: any; promise: any; currentDb: string } | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null, currentDb: 'none' };
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
    cached!.promise = connectWithFailover();
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
 * Handles the actual connection logic with proper failover
 */
async function connectWithFailover() {
  const opts = {
    bufferCommands: false,
    serverSelectionTimeoutMS: 5000, // 5 second timeout
    connectTimeoutMS: 10000, // 10 second timeout
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
    const connection = await mongoose.connect(connectionUri, opts);
    console.log(`Successfully connected to ${dbName} database`);
    cached!.currentDb = dbName;
    return connection;
  } catch (error) {
    console.error(`Failed to connect to ${dbName} database:`, error);

    // If primary fails and we weren't already using secondary, try secondary
    if (!useSecondary) {
      console.log('Attempting failover to secondary database...');
      try {
        const connection = await mongoose.connect(secondaryUri, opts);
        console.log('Successfully connected to secondary database (failover)');
        cached!.currentDb = 'secondary';
        return connection;
      } catch (secondaryError) {
        console.error('Failed to connect to secondary database:', secondaryError);
        throw new Error('Both primary and secondary database connections failed');
      }
    } else {
      throw error;
    }
  }
}

/**
 * Get current database connection status
 */
export function getConnectionStatus() {
  const useSecondary = process.env.USE_SECONDARY_DB === 'true';
  return {
    isConnected: mongoose.connection.readyState === 1,
    currentDatabase: cached?.currentDb || (useSecondary ? 'secondary' : 'primary'),
    connectionState: mongoose.connection.readyState,
    connectionStates: {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }
  };
}

/**
 * Switch database connection at runtime
 */
export async function switchDatabase(useSecondary: boolean) {
  console.log(`Switching to ${useSecondary ? 'secondary' : 'primary'} database...`);

  // Disconnect current connection
  await dbDisconnect();

  // Update environment variable for this session
  process.env.USE_SECONDARY_DB = useSecondary.toString();

  // Reconnect with new database
  return await dbConnect();
}

/**
 * Test database connection without switching
 */
export async function testDatabaseConnection(useSecondary: boolean) {
  const primaryUri = process.env.PRIMARY_DB_URI;
  const secondaryUri = process.env.SECONDARY_DB_URI;

  if (!primaryUri || !secondaryUri) {
    throw new Error('Database URIs are not configured');
  }

  const uri = useSecondary ? secondaryUri : primaryUri;
  const dbName = useSecondary ? 'secondary' : 'primary';

  const opts = {
    bufferCommands: false,
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  };

  try {
    // Create a separate connection for testing
    const testConnection = mongoose.createConnection(uri, opts);
    await testConnection.asPromise();
    await testConnection.close();
    return { success: true, database: dbName };
  } catch (error) {
    return {
      success: false,
      database: dbName,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Disconnect from database
 */
export async function dbDisconnect() {
  if (cached?.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    cached.currentDb = 'none';
  }
}

export default dbConnect;
