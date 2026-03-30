import mongoose from 'mongoose'

const MONGODB_URI = 'mongodb://localhost:27017/almaz_premium'

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined
}

const cached: MongooseCache =
  global._mongooseCache ?? (global._mongooseCache = { conn: null, promise: null })

export async function connectDB(): Promise<typeof mongoose> {
  // Return existing live connection immediately
  if (cached.conn) return cached.conn

  // If no in-flight promise, start one — wrapped in try/catch so a
  // refused connection never crashes the Next.js process.
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands:  false,   // fail fast instead of buffering ops
        serverSelectionTimeoutMS: 4000, // give up after 4 s, not 30 s
        dbName: 'almaz_premium',
      })
      .then((m) => {
        console.log('✅ [Almaz DB] Connected → mongodb: almaz_premium')
        return m
      })
      .catch((err: Error) => {
        // Clear the cached promise so the next request will retry
        cached.promise = null
        // Log clearly without crashing the process
        console.error('❌ [Almaz DB] Connection failed:', err.message)
        console.error('   ➜  Is MongoDB running?  Try: mongod --dbpath <your-path>')
        // Re-throw so callers can catch and return a 503
        throw err
      })
  }

  cached.conn = await cached.promise
  return cached.conn
}
