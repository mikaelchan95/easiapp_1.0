import { Mutex } from 'async-mutex';

// Mutex to prevent concurrent authentication operations
export const authMutex = new Mutex();

// Cache for ongoing authentication requests to prevent duplication
const authCache = new Map<string, Promise<any>>();

/**
 * Ensures only one authentication operation runs at a time
 * and deduplicates concurrent requests to the same endpoint
 */
export const withAuthMutex = async <T>(
  key: string,
  operation: () => Promise<T>
): Promise<T> => {
  return authMutex.runExclusive(async () => {
    // Check if we already have a pending request for this key
    if (authCache.has(key)) {
      console.log(`🔄 Deduplicating auth request for: ${key}`);
      return authCache.get(key);
    }

    // Start the operation and cache it
    const promise = operation();
    authCache.set(key, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      // Clean up cache when done
      authCache.delete(key);
    }
  });
};

/**
 * Clears all cached authentication requests
 */
export const clearAuthCache = () => {
  authCache.clear();
};