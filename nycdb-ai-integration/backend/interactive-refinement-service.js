/**
 * Interactive Refinement Service for NYCDB AI Integration
 * 
 * This service manages conversation context and handles follow-up questions
 * to enable an interactive, conversational experience for users.
 */

/**
 * Conversation context object to track conversation history and state
 */
class ConversationContext {
  constructor() {
    this.previousQueries = [];
    this.currentTopic = null;
    this.currentEntities = {};
    this.conversationId = generateConversationId();
    this.startTime = new Date().toISOString();
    this.messageCount = 0;
  }
  
  /**
   * Add a query to the conversation history
   * @param {Object} structuredQuery - The structured query from NLP service
   * @param {Object} response - The response generated for the query
   */
  addQuery(structuredQuery, response) {
    this.previousQueries.push({
      originalQuery: structuredQuery.originalQuery,
      queryType: structuredQuery.queryType,
      entities: structuredQuery.entities,
      timestamp: new Date().toISOString(),
      responseId: response.id || null
    });
    
    // Update current topic and entities
    if (structuredQuery.queryType) {
      this.currentTopic = structuredQuery.queryType;
    }
    
    if (structuredQuery.entities) {
      this.currentEntities = {
        ...this.currentEntities,
        ...structuredQuery.entities
      };
    }
    
    this.messageCount++;
  }
  
  /**
   * Get the most recent query in the conversation
   * @returns {Object|null} The most recent query or null if none exists
   */
  getLastQuery() {
    if (this.previousQueries.length === 0) {
      return null;
    }
    
    return this.previousQueries[this.previousQueries.length - 1];
  }
  
  /**
   * Check if the current query is a follow-up to the previous query
   * @param {Object} structuredQuery - The structured query to check
   * @returns {boolean} True if the query is a follow-up, false otherwise
   */
  isFollowUpQuery(structuredQuery) {
    const lastQuery = this.getLastQuery();
    if (!lastQuery) {
      return false;
    }
    
    // Check if the query is missing critical components that were in the previous query
    if (!structuredQuery.queryType && lastQuery.queryType) {
      return true;
    }
    
    // Check if the query refers to "these" or "those" or similar referential terms
    if (structuredQuery.originalQuery.match(/\b(these|those|them|it|this|that)\b/i)) {
      return true;
    }
    
    // Check if the query is missing location entities that were in the previous query
    if (lastQuery.entities.locations && 
        (!structuredQuery.entities.locations || structuredQuery.entities.locations.length === 0)) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Get conversation summary
   * @returns {Object} Summary of the conversation
   */
  getSummary() {
    return {
      conversationId: this.conversationId,
      startTime: this.startTime,
      messageCount: this.messageCount,
      currentTopic: this.currentTopic,
      currentEntities: this.currentEntities,
      queryHistory: this.previousQueries.map(q => q.originalQuery)
    };
  }
}

/**
 * Generate a unique conversation ID
 * @returns {string} Unique conversation ID
 */
function generateConversationId() {
  return 'conv_' + Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Conversation manager to handle multiple conversations
 */
class ConversationManager {
  constructor() {
    this.conversations = new Map();
    this.maxConversationAge = 30 * 60 * 1000; // 30 minutes
    this.maxConversationsPerUser = 5;
  }
  
  /**
   * Get or create a conversation context for a user
   * @param {string} userId - User ID
   * @param {string} conversationId - Optional conversation ID
   * @returns {ConversationContext} Conversation context
   */
  getOrCreateConversation(userId, conversationId = null) {
    // Clean up old conversations first
    this.cleanupOldConversations(userId);
    
    // If conversation ID is provided, try to get that specific conversation
    if (conversationId && this.conversations.has(`${userId}:${conversationId}`)) {
      return this.conversations.get(`${userId}:${conversationId}`);
    }
    
    // Otherwise, create a new conversation
    const newConversation = new ConversationContext();
    const key = `${userId}:${newConversation.conversationId}`;
    this.conversations.set(key, newConversation);
    
    return newConversation;
  }
  
  /**
   * Get all conversations for a user
   * @param {string} userId - User ID
   * @returns {Array} List of conversation summaries
   */
  getUserConversations(userId) {
    const userConversations = [];
    
    for (const [key, conversation] of this.conversations.entries()) {
      if (key.startsWith(`${userId}:`)) {
        userConversations.push(conversation.getSummary());
      }
    }
    
    return userConversations;
  }
  
  /**
   * Clean up old conversations for a user
   * @param {string} userId - User ID
   */
  cleanupOldConversations(userId) {
    const now = Date.now();
    const userConversations = [];
    
    // Identify all conversations for this user and their age
    for (const [key, conversation] of this.conversations.entries()) {
      if (key.startsWith(`${userId}:`)) {
        const age = now - new Date(conversation.startTime).getTime();
        userConversations.push({ key, age, conversation });
      }
    }
    
    // Remove old conversations
    userConversations.forEach(({ key, age }) => {
      if (age > this.maxConversationAge) {
        this.conversations.delete(key);
      }
    });
    
    // If still too many conversations, remove oldest ones
    if (userConversations.length > this.maxConversationsPerUser) {
      userConversations
        .sort((a, b) => b.age - a.age) // Sort by age, oldest first
        .slice(this.maxConversationsPerUser)
        .forEach(({ key }) => {
          this.conversations.delete(key);
        });
    }
  }
}

/**
 * Process a follow-up query using conversation context
 * @param {Object} structuredQuery - The structured query from NLP service
 * @param {ConversationContext} conversationContext - The conversation context
 * @returns {Object} Enhanced structured query with context
 */
function processFollowUpQuery(structuredQuery, conversationContext) {
  if (!conversationContext.isFollowUpQuery(structuredQuery)) {
    return structuredQuery;
  }
  
  const lastQuery = conversationContext.getLastQuery();
  const enhancedQuery = { ...structuredQuery };
  
  // If query type is missing, use the previous one
  if (!enhancedQuery.queryType && lastQuery.queryType) {
    enhancedQuery.queryType = lastQuery.queryType;
  }
  
  // If locations are missing, use the previous ones
  if ((!enhancedQuery.entities.locations || enhancedQuery.entities.locations.length === 0) && 
      lastQuery.entities.locations) {
    enhancedQuery.entities.locations = [...lastQuery.entities.locations];
  }
  
  // If building types are missing, use the previous ones
  if ((!enhancedQuery.entities.buildingTypes || enhancedQuery.entities.buildingTypes.length === 0) && 
      lastQuery.entities.buildingTypes) {
    enhancedQuery.entities.buildingTypes = [...lastQuery.entities.buildingTypes];
  }
  
  // If time periods are missing, use the previous ones
  if ((!enhancedQuery.entities.timePeriods || enhancedQuery.entities.timePeriods.length === 0) && 
      lastQuery.entities.timePeriods) {
    enhancedQuery.entities.timePeriods = [...lastQuery.entities.timePeriods];
  }
  
  return enhancedQuery;
}

/**
 * Generate refinement suggestions based on the current query and conversation context
 * @param {Object} structuredQuery - The structured query from NLP service
 * @param {Object} response - The response generated for the query
 * @param {ConversationContext} conversationContext - The conversation context
 * @returns {Array} List of refinement suggestions
 */
function generateRefinementSuggestions(structuredQuery, response, conversationContext) {
  const suggestions = [];
  
  // Add suggestion to see more details
  suggestions.push({
    text: "Tell me more details about this",
    query: `Tell me more details about ${structuredQuery.originalQuery}`
  });
  
  // Add suggestion to filter results if there are many
  if (response.data && response.data.length > 10) {
    suggestions.push({
      text: "Show me only the top results",
      query: `Show me only the top results from ${structuredQuery.originalQuery}`
    });
  }
  
  // Add suggestion to visualize data
  suggestions.push({
    text: "Can you visualize this data?",
    query: `Visualize the data from ${structuredQuery.originalQuery}`
  });
  
  // Add query-type specific suggestions
  switch (structuredQuery.queryType) {
    case 'risk_assessment':
      suggestions.push({
        text: "What factors contribute to these risks?",
        query: "What factors contribute to these building risks?"
      });
      break;
      
    case 'trend_analysis':
      suggestions.push({
        text: "What might explain these trends?",
        query: "What might explain these trends?"
      });
      break;
      
    case 'violation_search':
      suggestions.push({
        text: "Which buildings have the most violations?",
        query: "Which buildings have the most violations?"
      });
      break;
  }
  
  // If there are locations in the query, suggest comparing with another location
  if (structuredQuery.entities.locations && structuredQuery.entities.locations.length > 0) {
    const currentLocation = structuredQuery.entities.locations[0];
    const otherLocations = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island']
      .filter(loc => loc !== currentLocation);
    
    if (otherLocations.length > 0) {
      suggestions.push({
        text: `Compare with ${otherLocations[0]}`,
        query: `Compare ${structuredQuery.originalQuery} with ${otherLocations[0]}`
      });
    }
  }
  
  return suggestions;
}

module.exports = {
  ConversationContext,
  ConversationManager,
  processFollowUpQuery,
  generateRefinementSuggestions
};
