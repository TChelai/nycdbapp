/**
 * AI Analysis Service for NYCDB AI Integration
 * 
 * This service processes retrieved data to generate insights and perform advanced analysis
 * based on the user's query intent and the data retrieved from the database.
 */

const { Configuration, OpenAIApi } = require('openai');
const dotenv = require('dotenv');
const { QUERY_TYPES } = require('./nlp-service');

dotenv.config();

// Initialize OpenAI client
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

/**
 * Analyze data and generate insights based on query type and retrieved data
 * @param {Object} structuredQuery - The structured query from NLP service
 * @param {Object} retrievedData - Data retrieved from the database
 * @returns {Object} Analysis results and insights
 */
async function analyzeData(structuredQuery, retrievedData) {
  try {
    // Select analysis method based on query type
    let analysis;
    switch (structuredQuery.queryType) {
      case QUERY_TYPES.RISK_ASSESSMENT:
        analysis = await analyzeRiskData(structuredQuery, retrievedData);
        break;
      case QUERY_TYPES.TREND_ANALYSIS:
        analysis = await analyzeTrendData(structuredQuery, retrievedData);
        break;
      case QUERY_TYPES.VIOLATION_SEARCH:
        analysis = await analyzeViolationData(structuredQuery, retrievedData);
        break;
      case QUERY_TYPES.BUILDING_LOOKUP:
        analysis = await analyzeBuildingData(structuredQuery, retrievedData);
        break;
      case QUERY_TYPES.COMPARISON:
        analysis = await analyzeComparisonData(structuredQuery, retrievedData);
        break;
      case QUERY_TYPES.GENERAL_STATS:
        analysis = await analyzeGeneralStatsData(structuredQuery, retrievedData);
        break;
      default:
        analysis = await generateGeneralInsights(structuredQuery, retrievedData);
    }
    
    // Add AI-generated narrative insights
    const narrativeInsights = await generateNarrativeInsights(
      structuredQuery, 
      retrievedData, 
      analysis
    );
    
    return {
      ...analysis,
      narrativeInsights
    };
  } catch (error) {
    console.error('Error analyzing data:', error);
    throw new Error('Failed to analyze data and generate insights');
  }
}

/**
 * Analyze risk assessment data and identify high-risk buildings
 * @param {Object} structuredQuery - The structured query
 * @param {Object} retrievedData - Retrieved risk data
 * @returns {Object} Risk analysis results
 */
async function analyzeRiskData(structuredQuery, retrievedData) {
  const { data } = retrievedData;
  
  // Group buildings by risk level
  const riskGroups = {
    high: data.filter(b => b.risk_level === 'High'),
    medium: data.filter(b => b.risk_level === 'Medium'),
    low: data.filter(b => b.risk_level === 'Low'),
    minimal: data.filter(b => b.risk_level === 'Minimal')
  };
  
  // Calculate risk statistics
  const riskStats = {
    totalBuildings: data.length,
    highRiskCount: riskGroups.high.length,
    highRiskPercentage: (riskGroups.high.length / data.length * 100).toFixed(1),
    mediumRiskCount: riskGroups.medium.length,
    mediumRiskPercentage: (riskGroups.medium.length / data.length * 100).toFixed(1),
    averageRiskScore: data.reduce((sum, b) => sum + b.risk_score, 0) / data.length,
    topRiskFactors: identifyTopRiskFactors(data)
  };
  
  // Identify patterns in high-risk buildings
  const highRiskPatterns = identifyHighRiskPatterns(riskGroups.high);
  
  // Prepare visualization data
  const visualizationData = {
    riskDistribution: [
      { category: 'High', value: riskGroups.high.length },
      { category: 'Medium', value: riskGroups.medium.length },
      { category: 'Low', value: riskGroups.low.length },
      { category: 'Minimal', value: riskGroups.minimal.length }
    ],
    riskByBorough: calculateRiskByBorough(data),
    riskByBuildingAge: calculateRiskByBuildingAge(data)
  };
  
  return {
    riskStats,
    highRiskPatterns,
    visualizationData,
    topRiskBuildings: riskGroups.high.slice(0, 10) // Top 10 highest risk buildings
  };
}

/**
 * Analyze trend data to identify patterns over time
 * @param {Object} structuredQuery - The structured query
 * @param {Object} retrievedData - Retrieved trend data
 * @returns {Object} Trend analysis results
 */
async function analyzeTrendData(structuredQuery, retrievedData) {
  const { data, timeRange } = retrievedData;
  
  // Calculate trend statistics
  const trendStats = calculateTrendStatistics(data);
  
  // Identify significant changes in the trend
  const significantChanges = identifySignificantChanges(data);
  
  // Perform time series analysis
  const timeSeriesAnalysis = analyzeTimeSeries(data);
  
  // Prepare visualization data
  const visualizationData = {
    trendLine: data.map(d => ({
      date: d.time_period,
      value: d.count
    })),
    movingAverage: calculateMovingAverage(data, 3), // 3-month moving average
    yearOverYearComparison: calculateYearOverYearComparison(data)
  };
  
  return {
    trendStats,
    significantChanges,
    timeSeriesAnalysis,
    visualizationData,
    timeRange
  };
}

/**
 * Analyze violation data to identify patterns and common violations
 * @param {Object} structuredQuery - The structured query
 * @param {Object} retrievedData - Retrieved violation data
 * @returns {Object} Violation analysis results
 */
async function analyzeViolationData(structuredQuery, retrievedData) {
  const { data } = retrievedData;
  
  // Group violations by type
  const violationsByType = groupViolationsByType(data);
  
  // Group violations by status
  const violationsByStatus = groupViolationsByStatus(data);
  
  // Group violations by source (HPD vs DOB)
  const violationsBySource = groupViolationsBySource(data);
  
  // Identify buildings with multiple violations
  const buildingsWithMultipleViolations = identifyBuildingsWithMultipleViolations(data);
  
  // Prepare visualization data
  const visualizationData = {
    violationsByType: Object.entries(violationsByType).map(([type, count]) => ({
      category: type,
      value: count
    })).sort((a, b) => b.value - a.value).slice(0, 10),
    violationsByStatus: Object.entries(violationsByStatus).map(([status, count]) => ({
      category: status,
      value: count
    })),
    violationsBySource: Object.entries(violationsBySource).map(([source, count]) => ({
      category: source,
      value: count
    }))
  };
  
  return {
    violationStats: {
      totalViolations: data.length,
      openViolations: violationsByStatus['OPEN'] || 0,
      closedViolations: violationsByStatus['CLOSED'] || 0,
      hpdViolations: violationsBySource['HPD'] || 0,
      dobViolations: violationsBySource['DOB'] || 0
    },
    topViolationTypes: Object.entries(violationsByType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count })),
    buildingsWithMultipleViolations,
    visualizationData
  };
}

/**
 * Analyze building data to provide insights about specific buildings
 * @param {Object} structuredQuery - The structured query
 * @param {Object} retrievedData - Retrieved building data
 * @returns {Object} Building analysis results
 */
async function analyzeBuildingData(structuredQuery, retrievedData) {
  const { data } = retrievedData;
  
  // Calculate building statistics
  const buildingStats = {
    totalBuildings: data.length,
    averageYearBuilt: calculateAverage(data, 'yearbuilt'),
    averageFloors: calculateAverage(data, 'numfloors'),
    averageUnits: calculateAverage(data, 'unitsres'),
    buildingTypes: countBuildingTypes(data)
  };
  
  // Prepare visualization data
  const visualizationData = {
    buildingsByType: Object.entries(buildingStats.buildingTypes).map(([type, count]) => ({
      category: type,
      value: count
    })).sort((a, b) => b.value - a.value),
    buildingsByAge: groupBuildingsByAge(data),
    buildingsBySize: groupBuildingsBySize(data)
  };
  
  return {
    buildingStats,
    visualizationData,
    buildings: data.slice(0, 10) // Limit to first 10 buildings for display
  };
}

/**
 * Analyze comparison data between different areas or building types
 * @param {Object} structuredQuery - The structured query
 * @param {Object} retrievedData - Retrieved comparison data
 * @returns {Object} Comparison analysis results
 */
async function analyzeComparisonData(structuredQuery, retrievedData) {
  const { data, comparisonBy } = retrievedData;
  
  // Calculate comparison statistics
  const comparisonStats = {
    totalCategories: data.length,
    comparisonMetrics: [
      'building_count',
      'avg_year_built',
      'avg_floors',
      'avg_residential_units',
      'hpd_violation_count',
      'dob_violation_count'
    ]
  };
  
  // Identify significant differences between categories
  const significantDifferences = identifySignificantDifferences(data, comparisonStats.comparisonMetrics);
  
  // Prepare visualization data
  const visualizationData = {};
  
  // Create a chart for each metric
  comparisonStats.comparisonMetrics.forEach(metric => {
    visualizationData[metric] = data.map(item => ({
      category: item[comparisonBy[0]],
      value: item[metric]
    })).sort((a, b) => b.value - a.value);
  });
  
  return {
    comparisonStats,
    significantDifferences,
    visualizationData,
    comparisonData: data
  };
}

/**
 * Analyze general statistics about buildings
 * @param {Object} structuredQuery - The structured query
 * @param {Object} retrievedData - Retrieved general stats data
 * @returns {Object} General statistics analysis
 */
async function analyzeGeneralStatsData(structuredQuery, retrievedData) {
  const { data } = retrievedData;
  
  // Calculate derived statistics
  const derivedStats = {
    averageUnitsPerBuilding: data.total_residential_units / data.total_buildings,
    violationsPerBuilding: (data.total_hpd_violations + data.total_dob_violations) / data.total_buildings,
    buildingAgeRange: data.newest_building - data.oldest_building,
    averageBuildingAge: new Date().getFullYear() - data.avg_year_built
  };
  
  // Prepare visualization data
  const visualizationData = {
    violationDistribution: [
      { category: 'HPD Violations', value: data.total_hpd_violations },
      { category: 'DOB Violations', value: data.total_dob_violations }
    ],
    buildingAgeDistribution: [
      { category: 'Pre-1900', value: 0 }, // These would need actual data
      { category: '1900-1950', value: 0 },
      { category: '1951-2000', value: 0 },
      { category: 'Post-2000', value: 0 }
    ]
  };
  
  return {
    generalStats: data,
    derivedStats,
    visualizationData
  };
}

/**
 * Generate general insights for any other query type
 * @param {Object} structuredQuery - The structured query
 * @param {Object} retrievedData - Retrieved data
 * @returns {Object} General insights
 */
async function generateGeneralInsights(structuredQuery, retrievedData) {
  const { data } = retrievedData;
  
  // Basic statistics about the result set
  const basicStats = {
    resultCount: data.length,
    fields: data.length > 0 ? Object.keys(data[0]) : []
  };
  
  // For numerical fields, calculate min, max, avg
  const numericalStats = {};
  if (data.length > 0) {
    basicStats.fields.forEach(field => {
      if (typeof data[0][field] === 'number') {
        numericalStats[field] = {
          min: Math.min(...data.map(item => item[field])),
          max: Math.max(...data.map(item => item[field])),
          avg: data.reduce((sum, item) => sum + item[field], 0) / data.length
        };
      }
    });
  }
  
  return {
    basicStats,
    numericalStats,
    data: data.slice(0, 10) // Limit to first 10 items for display
  };
}

/**
 * Generate narrative insights using AI based on the analysis results
 * @param {Object} structuredQuery - The structured query
 * @param {Object} retrievedData - Retrieved data
 * @param {Object} analysis - Analysis results
 * @returns {Object} Narrative insights
 */
async function generateNarrativeInsights(structuredQuery, retrievedData, analysis) {
  try {
    // Prepare the prompt for the language model
    const prompt = prepareInsightPrompt(structuredQuery, retrievedData, analysis);
    
    // Call the language model to generate insights
    const completion = await openai.createCompletion({
      model: "gpt-3.5-turbo-instruct",
      prompt: prompt,
      max_tokens: 800,
      temperature: 0.7,
    });

    // Parse the response
    const insights = completion.data.choices[0].text.trim();
    
    // Extract key findings and explanations
    const keyFindings = extractKeyFindings(insights);
    const explanations = extractExplanations(insights);
    
    return {
      summary: insights,
      keyFindings,
      explanations,
      confidence: 0.85 // Placeholder for a real confidence score
    };
  } catch (error) {
    console.error('Error generating narrative insights:', error);
    return {
      summary: "Unable to generate insights due to an error.",
      keyFindings: [],
      explanations: [],
      confidence: 0
    };
  }
}

/**
 * Prepare prompt for generating insights
 * @param {Object} structuredQuery - The structured query
 * @param {Object} retrievedData - Retrieved data
 * @param {Object} analysis - Analysis results
 * @returns {string} Formatted prompt
 */
function prepareInsightPrompt(structuredQuery, retrievedData, analysis) {
  // Base prompt with context about the query and data
  let prompt = `
You are an expert analyst of NYC Department of Buildings data. Based on the following query and analysis results, 
provide insightful observations about the data. Focus on patterns, trends, and notable findings.

User Query: "${structuredQuery.originalQuery}"

Query Type: ${structuredQuery.queryType}

Data Summary: ${JSON.stringify(retrievedData.metadata)}

Analysis Results: ${JSON.stringify(analysis, null, 2).substring(0, 1500)}

Provide a concise summary of key insights, including:
1. Most significant findings
2. Patterns or trends identified
3. Possible explanations for these patterns
4. Any recommendations or next steps for further investigation

Your response should be informative, factual, and avoid speculation beyond what the data supports.
`;

  return prompt;
}

/**
 * Extract key findings from generated insights
 * @param {string} insights - Generated insights text
 * @returns {Array} List of key findings
 */
function extractKeyFindings(insights) {
  // Simple extraction based on common patterns
  const findingsMatch = insights.match(/key findings:?([\s\S]*?)(?:\n\n|$)/i);
  if (findingsMatch && findingsMatch[1]) {
    return findingsMatch[1]
      .split(/\n-|\n\d+\./)
      .map(item => item.trim())
      .filter(Boolean);
  }
  
  // Fallback: look for sentences that seem like findings
  const sentences = insights.split(/\.\s+/);
  return sentences
    .filter(sentence => 
      sentence.includes('significant') || 
      sentence.includes('notable') || 
      sentence.includes('important') ||
      sentence.includes('found that')
    )
    .map(sentence => sentence.trim() + '.');
}

/**
 * Extract explanations from generated insights
 * @param {string} insights - Generated insights text
 * @returns {Array} List of explanations
 */
function extractExplanations(insights) {
  // Look for explanation patterns
  const explanationMatches = insights.match(/(?:because|due to|explained by|result of|caused by)([^.]+)/gi);
  
  if (explanationMatches) {
    return explanationMatches.map(match => match.trim());
  }
  
  return [];
}

// Helper functions for specific analyses

/**
 * Identify top risk factors in building data
 * @param {Array} buildings - Building data
 * @returns {Array} Top risk factors
 */
function identifyTopRiskFactors(buildings) {
  // Count buildings with high age scores vs high violation scores
  const highAgeScore = buildings.filter(b => b.age_score > 70).length;
  const highViolationScore = building<response clipped><NOTE>To save on context only part of this file has been shown to you. You should retry this tool after you have searched inside the file with `grep -n` in order to find the line numbers of what you are looking for.</NOTE>