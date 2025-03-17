/**
 * Test suite for Data Analysis Service
 * 
 * This file contains tests for the data analysis service
 */

const { analyzeData } = require('../src/data-analysis-service');
const { detectPatterns } = require('../src/pattern-detection-service');
const { generateVisualizations } = require('../src/visualization-generator');
const { generateNarrativeInsights, generateRecommendations } = require('../src/ai-insight-generator');

// Mock dependencies
jest.mock('../src/pattern-detection-service', () => ({
  detectPatterns: jest.fn().mockReturnValue({
    significantPatterns: [
      { type: 'geographic_concentration', description: 'Test pattern', importance: 'high' }
    ],
    anomalies: [
      { type: 'high_violation_count', description: 'Test anomaly', importance: 'medium' }
    ]
  })
}));

jest.mock('../src/visualization-generator', () => ({
  generateVisualizations: jest.fn().mockReturnValue([
    { type: 'barChart', title: 'Test Chart', data: [] },
    { type: 'pieChart', title: 'Test Pie', data: [] }
  ])
}));

jest.mock('../src/ai-insight-generator', () => ({
  generateNarrativeInsights: jest.fn().mockResolvedValue({
    summary: 'Test summary',
    keyFindings: ['Finding 1', 'Finding 2'],
    explanations: ['Explanation 1']
  }),
  generateRecommendations: jest.fn().mockResolvedValue([
    'Recommendation 1',
    'Recommendation 2'
  ])
}));

describe('Data Analysis Service', () => {
  describe('analyzeData', () => {
    it('should analyze risk assessment data correctly', async () => {
      const structuredQuery = {
        queryType: 'risk_assessment',
        filters: [{ column: 'borough', operator: '=', value: 'Brooklyn' }],
        originalQuery: 'Show me buildings in Brooklyn with high risk'
      };
      
      const retrievedData = {
        data: [
          { bbl: '1234567890', address: '123 Test St', borough: 'Brooklyn', yearbuilt: 1950, risk_score: 85, risk_level: 'High' },
          { bbl: '0987654321', address: '456 Sample Ave', borough: 'Brooklyn', yearbuilt: 1970, risk_score: 75, risk_level: 'Medium' }
        ]
      };
      
      const result = await analyzeData(structuredQuery, retrievedData);
      
      expect(result).toBeDefined();
      expect(result.riskStats).toBeDefined();
      expect(result.patterns).toBeDefined();
      expect(result.visualizations).toBeDefined();
      expect(result.insights).toBeDefined();
      expect(result.recommendations).toBeDefined();
      
      expect(detectPatterns).toHaveBeenCalledWith(structuredQuery, expect.any(Object));
      expect(generateVisualizations).toHaveBeenCalledWith(structuredQuery, expect.any(Object));
      expect(generateNarrativeInsights).toHaveBeenCalledWith(structuredQuery, expect.any(Object));
      expect(generateRecommendations).toHaveBeenCalledWith(structuredQuery, expect.any(Object));
    });
    
    it('should analyze violation data correctly', async () => {
      const structuredQuery = {
        queryType: 'violation_search',
        filters: [{ column: 'borough', operator: '=', value: 'Manhattan' }],
        originalQuery: 'What are the most common violations in Manhattan?'
      };
      
      const retrievedData = {
        data: [
          { violationid: '1', bbl: '1234567890', address: '123 Test St', borough: 'Manhattan', violationtype: 'Type A', violationstatus: 'Open' },
          { violationid: '2', bbl: '0987654321', address: '456 Sample Ave', borough: 'Manhattan', violationtype: 'Type B', violationstatus: 'Closed' },
          { violationid: '3', bbl: '1234567890', address: '123 Test St', borough: 'Manhattan', violationtype: 'Type A', violationstatus: 'Open' }
        ]
      };
      
      const result = await analyzeData(structuredQuery, retrievedData);
      
      expect(result).toBeDefined();
      expect(result.violationStats).toBeDefined();
      expect(result.patterns).toBeDefined();
      expect(result.visualizations).toBeDefined();
      expect(result.insights).toBeDefined();
      expect(result.recommendations).toBeDefined();
      
      expect(detectPatterns).toHaveBeenCalledWith(structuredQuery, expect.any(Object));
      expect(generateVisualizations).toHaveBeenCalledWith(structuredQuery, expect.any(Object));
      expect(generateNarrativeInsights).toHaveBeenCalledWith(structuredQuery, expect.any(Object));
      expect(generateRecommendations).toHaveBeenCalledWith(structuredQuery, expect.any(Object));
    });
    
    it('should handle empty data gracefully', async () => {
      const structuredQuery = {
        queryType: 'building_lookup',
        filters: [{ column: 'borough', operator: '=', value: 'Staten Island' }],
        originalQuery: 'Show me buildings in Staten Island'
      };
      
      const retrievedData = {
        data: []
      };
      
      const result = await analyzeData(structuredQuery, retrievedData);
      
      expect(result).toBeDefined();
      expect(result.basicStats).toBeDefined();
      expect(result.basicStats.recordCount).toBe(0);
    });
  });
});
