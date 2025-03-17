/**
 * Test suite for AI Controller
 * 
 * This file contains tests for the AI controller endpoints
 */

const request = require('supertest');
const express = require('express');
const aiController = require('../src/controllers/ai-controller');

// Mock dependencies
jest.mock('../src/services/nlp-service', () => ({
  processQuery: jest.fn().mockResolvedValue({
    queryType: 'risk_assessment',
    filters: [{ column: 'borough', operator: '=', value: 'Brooklyn' }],
    originalQuery: 'Show me buildings in Brooklyn with high risk'
  })
}));

jest.mock('../src/services/data-retrieval-service', () => ({
  retrieveData: jest.fn().mockResolvedValue({
    data: [
      { bbl: '1234567890', address: '123 Test St', borough: 'Brooklyn', risk_score: 85, risk_level: 'High' },
      { bbl: '0987654321', address: '456 Sample Ave', borough: 'Brooklyn', risk_score: 75, risk_level: 'Medium' }
    ]
  })
}));

jest.mock('../src/services/data-analysis-service', () => ({
  analyzeData: jest.fn().mockResolvedValue({
    riskStats: { totalBuildings: 2, riskLevelCounts: { High: 1, Medium: 1 } },
    insights: { summary: 'Test summary', keyFindings: ['Finding 1', 'Finding 2'] },
    visualizations: [{ type: 'barChart', title: 'Test Chart', data: [] }],
    recommendations: ['Recommendation 1', 'Recommendation 2']
  })
}));

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/ai', aiController);

describe('AI Controller', () => {
  describe('POST /api/ai/query', () => {
    it('should process a query and return results', async () => {
      const response = await request(app)
        .post('/api/ai/query')
        .send({
          query: 'Show me buildings in Brooklyn with high risk',
          userId: 'test-user'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.response).toBeDefined();
      expect(response.body.response.insights).toBeDefined();
      expect(response.body.response.visualizations).toBeDefined();
      expect(response.body.response.recommendations).toBeDefined();
    });
    
    it('should return an error when query is missing', async () => {
      const response = await request(app)
        .post('/api/ai/query')
        .send({
          userId: 'test-user'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });
  
  describe('GET /api/ai/conversations', () => {
    it('should return conversation history for a user', async () => {
      const response = await request(app)
        .get('/api/ai/conversations')
        .query({ userId: 'test-user' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
    
    it('should return an error when userId is missing', async () => {
      const response = await request(app)
        .get('/api/ai/conversations');
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });
  });
});
