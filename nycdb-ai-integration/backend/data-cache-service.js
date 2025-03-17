/**
 * Data Cache Service for NYCDB AI Integration
 * 
 * This service provides caching functionality for database queries to improve performance
 * and reduce database load for frequently requested data.
 */

const NodeCache = require('node-cache');

// Initialize cache with standard TTL of 10 minutes and check period of 60 seconds
const cache = new NodeCache({ 
  stdTTL: 600, 
  checkperiod: 60,
  useClones: false
});

/**
 * Get data from cache or execute the provided function to retrieve it
 * @param {string} key - Cache key
 * @param {Function} fetchFunction - Function to execute if cache miss
 * @param {number} ttl - Time to live in seconds (optional)
 * @returns {Promise<any>} Cached or freshly fetched data
 */
async function getOrFetch(key, fetchFunction, ttl = null) {
  // Check if data exists in cache
  const cachedData = cache.get(key);
  
  if (cachedData !== undefined) {
    console.log(`Cache hit for key: ${key}`);
    return cachedData;
  }
  
  // Cache miss, execute fetch function
  console.log(`Cache miss for key: ${key}, fetching data...`);
  try {
    const data = await fetchFunction();
    
    // Store in cache with optional custom TTL
    if (ttl) {
      cache.set(key, data, ttl);
    } else {
      cache.set(key, data);
    }
    
    return data;
  } catch (error) {
    console.error(`Error fetching data for key ${key}:`, error);
    throw error;
  }
}

/**
 * Generate a cache key from query parameters
 * @param {string} queryType - Type of query
 * @param {Object} queryParams - Query parameters
 * @returns {string} Cache key
 */
function generateCacheKey(queryType, queryParams) {
  return `${queryType}:${JSON.stringify(queryParams)}`;
}

/**
 * Clear cache entries matching a pattern
 * @param {string} pattern - Pattern to match (e.g., 'risk_assessment:*')
 */
function clearCachePattern(pattern) {
  const keys = cache.keys();
  const matchingKeys = keys.filter(key => {
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      return key.startsWith(prefix);
    }
    return key === pattern;
  });
  
  matchingKeys.forEach(key => {
    cache.del(key);
  });
  
  console.log(`Cleared ${matchingKeys.length} cache entries matching pattern: ${pattern}`);
}

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
function getCacheStats() {
  return {
    keys: cache.keys().length,
    hits: cache.getStats().hits,
    misses: cache.getStats().misses,
    ksize: cache.getStats().ksize,
    vsize: cache.getStats().vsize
  };
}

module.exports = {
  getOrFetch,
  generateCacheKey,
  clearCachePattern,
  getCacheStats
};
