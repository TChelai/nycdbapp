/**
 * API Controller for AI Integration with NYCDB
 * 
 * This controller handles the API endpoints for the AI integration,
 * connecting the frontend with the NLP, data retrieval, analysis, and
 * results generation services.
 */

const express = require('express');
const router = express.Router();
const { processQuery } = require('./nlp-service');
const { retrieveData } = require('./data-retrieval-service');
const { analyzeData } = require('./ai-analysis-service');
const { generateResponse } = require('./results-generation-service');
const { ConversationManager, processFollowUpQuery } = require('./interactive-refinement-service');

// Initialize conversation manager
const conversationManager = new ConversationManager();

/**
 * Process a natural language query about NYC DOB data
 * POST /api/ai/query
 */
router.post('/query', async (req, res) => {
  try {
    const { query, userId, conversationId } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Query is required'
      });
    }
    
    // Get or create conversation context
    const userIdToUse = userId || 'anonymous';
    const conversationContext = conversationManager.getOrCreateConversation(
      userIdToUse, 
      conversationId
    );
    
    // Process the query with NLP
    const structuredQuery = await processQuery(query, conversationContext);
    
    // Enhance with conversation context if it's a follow-up
    const enhancedQuery = processFollowUpQuery(structuredQuery, conversationContext);
    
    // Retrieve data based on the structured query
    const retrievedData = await retrieveData(enhancedQuery);
    
    // Analyze the data
    const analysisResults = await analyzeData(enhancedQuery, retrievedData);
    
    // Generate the response
    const response = generateResponse(enhancedQuery, retrievedData, analysisResults);
    
    // Add the response to the conversation context
    conversationContext.addQuery(enhancedQuery, response);
    
    // Add conversation metadata to the response
    response.conversationId = conversationContext.conversationId;
    response.messageCount = conversationContext.messageCount;
    
    res.status(200).json({
      success: true,
      response
    });
  } catch (error) {
    console.error('Error processing AI query:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to process AI query'
    });
  }
});

/**
 * Get conversation history for a user
 * GET /api/ai/conversations
 */
router.get('/conversations', (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'User ID is required'
      });
    }
    
    const conversations = conversationManager.getUserConversations(userId);
    
    res.status(200).json({
      success: true,
      count: conversations.length,
      data: conversations
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to get conversations'
    });
  }
});

/**
 * Get a specific conversation
 * GET /api/ai/conversations/:conversationId
 */
router.get('/conversations/:conversationId', (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'User ID is required'
      });
    }
    
    const conversation = conversationManager.getOrCreateConversation(userId, conversationId);
    
    if (conversation.conversationId !== conversationId) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Conversation not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: conversation.getSummary()
    });
  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to get conversation'
    });
  }
});

module.exports = router;
