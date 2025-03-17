/**
 * Test suite for NLP Service
 * 
 * This file contains tests for the natural language processing service
 */

const { processQuery } = require('../src/nlp-service');

// Mock conversation context
const mockConversationContext = {
  conversationId: 'test-conversation',
  queries: [],
  addQuery: jest.fn()
};

describe('NLP Service', () => {
  describe('processQuery', () => {
    it('should process a risk assessment query correctly', async () => {
      const query = 'Show me buildings in Brooklyn with a high risk of structural issues';
      
      const result = await processQuery(query, mockConversationContext);
      
      expect(result).toBeDefined();
      expect(result.queryType).toBe('risk_assessment');
      expect(result.filters).toContainEqual(
        expect.objectContaining({ 
          column: expect.any(String), 
          operator: expect.any(String), 
          value: 'Brooklyn' 
        })
      );
      expect(result.originalQuery).toBe(query);
    });
    
    it('should process a violation search query correctly', async () => {
      const query = 'What are the most common violations in Manhattan high-rises?';
      
      const result = await processQuery(query, mockConversationContext);
      
      expect(result).toBeDefined();
      expect(result.queryType).toBe('violation_search');
      expect(result.filters).toContainEqual(
        expect.objectContaining({ 
          column: expect.any(String), 
          operator: expect.any(String), 
          value: 'Manhattan' 
        })
      );
      expect(result.originalQuery).toBe(query);
    });
    
    it('should process a trend analysis query correctly', async () => {
      const query = 'Has construction activity increased in Queens over the past five years?';
      
      const result = await processQuery(query, mockConversationContext);
      
      expect(result).toBeDefined();
      expect(result.queryType).toBe('trend_analysis');
      expect(result.filters).toContainEqual(
        expect.objectContaining({ 
          column: expect.any(String), 
          operator: expect.any(String), 
          value: 'Queens' 
        })
      );
      expect(result.timeRange).toBeDefined();
      expect(result.originalQuery).toBe(query);
    });
    
    it('should handle ambiguous queries by requesting clarification', async () => {
      const query = 'Show me building data';
      
      const result = await processQuery(query, mockConversationContext);
      
      expect(result).toBeDefined();
      expect(result.needsClarification).toBe(true);
      expect(result.clarificationOptions).toBeDefined();
      expect(result.originalQuery).toBe(query);
    });
  });
});
