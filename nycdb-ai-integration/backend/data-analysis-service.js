/**
 * Data Analysis Service for NYCDB AI Integration
 * 
 * This service processes retrieved data to perform statistical analysis,
 * prepare data for visualization, and identify key metrics and trends.
 */

const { detectPatterns } = require('./pattern-detection-service');
const { generateVisualizations } = require('./visualization-generator');
const { generateNarrativeInsights, generateRecommendations } = require('./ai-insight-generator');

/**
 * Analyze data based on the structured query
 * @param {Object} structuredQuery - The structured query from NLP service
 * @param {Object} retrievedData - Data retrieved from the database
 * @returns {Object} Analysis results
 */
async function analyzeData(structuredQuery, retrievedData) {
  try {
    // Perform basic statistical analysis
    const basicStats = calculateBasicStatistics(retrievedData);
    
    // Perform specific analysis based on query type
    let analysisResults;
    switch (structuredQuery.queryType) {
      case 'risk_assessment':
        analysisResults = analyzeRiskData(retrievedData, structuredQuery);
        break;
      case 'trend_analysis':
        analysisResults = analyzeTrendData(retrievedData, structuredQuery);
        break;
      case 'violation_search':
        analysisResults = analyzeViolationData(retrievedData, structuredQuery);
        break;
      case 'building_lookup':
        analysisResults = analyzeBuildingData(retrievedData, structuredQuery);
        break;
      case 'comparison':
        analysisResults = analyzeComparisonData(retrievedData, structuredQuery);
        break;
      case 'general_stats':
        analysisResults = analyzeGeneralStats(retrievedData, structuredQuery);
        break;
      default:
        analysisResults = analyzeGenericData(retrievedData, structuredQuery);
    }
    
    // Add basic stats to the analysis results
    analysisResults.basicStats = basicStats;
    
    // Detect patterns in the data
    const patterns = detectPatterns(structuredQuery, analysisResults);
    analysisResults.patterns = patterns;
    
    // Generate visualizations
    const visualizations = generateVisualizations(structuredQuery, analysisResults);
    analysisResults.visualizations = visualizations;
    
    // Generate narrative insights
    const insights = await generateNarrativeInsights(structuredQuery, analysisResults);
    analysisResults.insights = insights;
    
    // Generate recommendations
    const recommendations = await generateRecommendations(structuredQuery, analysisResults);
    analysisResults.recommendations = recommendations;
    
    return analysisResults;
  } catch (error) {
    console.error('Error analyzing data:', error);
    throw error;
  }
}

/**
 * Calculate basic statistics for the retrieved data
 * @param {Object} retrievedData - Data retrieved from the database
 * @returns {Object} Basic statistics
 */
function calculateBasicStatistics(retrievedData) {
  const stats = {
    recordCount: 0,
    fields: [],
    numericalStats: {}
  };
  
  if (!retrievedData || !retrievedData.data || !Array.isArray(retrievedData.data)) {
    return stats;
  }
  
  const data = retrievedData.data;
  stats.recordCount = data.length;
  
  if (data.length === 0) {
    return stats;
  }
  
  // Get field names
  const firstRow = data[0];
  stats.fields = Object.keys(firstRow);
  
  // Calculate statistics for numerical fields
  stats.fields.forEach(field => {
    if (typeof firstRow[field] === 'number') {
      const values = data.map(row => row[field]).filter(val => val !== null && !isNaN(val));
      
      if (values.length > 0) {
        const sum = values.reduce((acc, val) => acc + val, 0);
        const avg = sum / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        
        // Calculate standard deviation
        const squaredDiffs = values.map(val => Math.pow(val - avg, 2));
        const avgSquaredDiff = squaredDiffs.reduce((acc, val) => acc + val, 0) / values.length;
        const stdDev = Math.sqrt(avgSquaredDiff);
        
        stats.numericalStats[field] = {
          count: values.length,
          sum,
          avg,
          min,
          max,
          stdDev
        };
      }
    }
  });
  
  return stats;
}

/**
 * Analyze risk assessment data
 * @param {Object} retrievedData - Risk assessment data
 * @param {Object} structuredQuery - The structured query
 * @returns {Object} Risk analysis results
 */
function analyzeRiskData(retrievedData, structuredQuery) {
  const results = {
    riskStats: {},
    highRiskPatterns: {},
    topRiskBuildings: [],
    visualizationData: {}
  };
  
  if (!retrievedData || !retrievedData.data || !Array.isArray(retrievedData.data)) {
    return results;
  }
  
  const data = retrievedData.data;
  
  // Count buildings by risk level
  const riskLevelCounts = {
    High: 0,
    Medium: 0,
    Low: 0,
    Minimal: 0
  };
  
  data.forEach(building => {
    if (building.risk_level) {
      riskLevelCounts[building.risk_level] = (riskLevelCounts[building.risk_level] || 0) + 1;
    }
  });
  
  results.riskStats.riskLevelCounts = riskLevelCounts;
  results.riskStats.totalBuildings = data.length;
  
  // Calculate percentage of buildings in each risk level
  const riskLevelPercentages = {};
  Object.entries(riskLevelCounts).forEach(([level, count]) => {
    riskLevelPercentages[level] = ((count / data.length) * 100).toFixed(1);
  });
  
  results.riskStats.riskLevelPercentages = riskLevelPercentages;
  
  // Prepare data for risk level distribution visualization
  results.visualizationData.riskDistribution = Object.entries(riskLevelCounts).map(([level, count]) => ({
    category: level,
    value: count
  }));
  
  // Identify high risk buildings
  const highRiskBuildings = data.filter(building => building.risk_level === 'High');
  results.topRiskBuildings = highRiskBuildings.sort((a, b) => b.risk_score - a.risk_score);
  
  // Analyze common factors among high risk buildings
  if (highRiskBuildings.length > 0) {
    // Analyze by borough
    const boroughCounts = {};
    highRiskBuildings.forEach(building => {
      const borough = building.borough || 'Unknown';
      boroughCounts[borough] = (boroughCounts[borough] || 0) + 1;
    });
    
    // Analyze by building age
    const currentYear = new Date().getFullYear();
    const ageCounts = {
      'Pre-1900': 0,
      '1900-1950': 0,
      '1951-1980': 0,
      '1981-2000': 0,
      'Post-2000': 0
    };
    
    highRiskBuildings.forEach(building => {
      const yearBuilt = building.yearbuilt;
      if (!yearBuilt) return;
      
      if (yearBuilt < 1900) ageCounts['Pre-1900']++;
      else if (yearBuilt <= 1950) ageCounts['1900-1950']++;
      else if (yearBuilt <= 1980) ageCounts['1951-1980']++;
      else if (yearBuilt <= 2000) ageCounts['1981-2000']++;
      else ageCounts['Post-2000']++;
    });
    
    // Analyze by building class
    const buildingClassCounts = {};
    highRiskBuildings.forEach(building => {
      const buildingClass = building.bldgclass || 'Unknown';
      buildingClassCounts[buildingClass] = (buildingClassCounts[buildingClass] || 0) + 1;
    });
    
    // Prepare common factors data
    const commonFactors = [];
    
    // Add borough factors
    Object.entries(boroughCounts).forEach(([borough, count]) => {
      commonFactors.push({
        factor: 'Borough',
        value: borough,
        count,
        percentage: ((count / highRiskBuildings.length) * 100).toFixed(1)
      });
    });
    
    // Add age factors
    Object.entries(ageCounts).forEach(([ageRange, count]) => {
      if (count > 0) {
        commonFactors.push({
          factor: 'Age Range',
          value: ageRange,
          count,
          percentage: ((count / highRiskBuildings.length) * 100).toFixed(1)
        });
      }
    });
    
    // Add building class factors
    Object.entries(buildingClassCounts).forEach(([buildingClass, count]) => {
      if (count > 0) {
        commonFactors.push({
          factor: 'Building Class',
          value: buildingClass,
          count,
          percentage: ((count / highRiskBuildings.length) * 100).toFixed(1)
        });
      }
    });
    
    results.highRiskPatterns.commonFactors = commonFactors;
    
    // Prepare data for risk by borough visualization
    results.visualizationData.riskByBorough = Object.entries(boroughCounts).map(([borough, count]) => ({
      borough,
      highRiskCount: count
    }));
    
    // Prepare data for risk by building age visualization
    results.visualizationData.riskByBuildingAge = Object.entries(ageCounts).map(([ageRange, count]) => ({
      ageRange,
      highRiskCount: count
    }));
  }
  
  return results;
}

/**
 * Analyze trend data
 * @param {Object} retrievedData - Trend data
 * @param {Object} structuredQuery - The structured query
 * @returns {Object} Trend analysis results
 */
function analyzeTrendData(retrievedData, structuredQuery) {
  const results = {
    trendStats: {},
    significantChanges: [],
    timeSeriesAnalysis: {},
    visualizationData: {}
  };
  
  if (!retrievedData || !retrievedData.data || !Array.isArray(retrievedData.data)) {
    return results;
  }
  
  const data = retrievedData.data;
  
  if (data.length === 0) {
    return results;
  }
  
  // Sort data by time period
  const sortedData = [...data].sort((a, b) => {
    return new Date(a.time_period) - new Date(b.time_period);
  });
  
  // Calculate overall trend
  const firstValue = sortedData[0].count;
  const lastValue = sortedData[sortedData.length - 1].count;
  const percentChange = ((lastValue - firstValue) / firstValue * 100).toFixed(1);
  const trend = percentChange >= 0 ? 'increasing' : 'decreasing';
  
  results.trendStats = {
    firstPeriod: sortedData[0].time_period,
    lastPeriod: sortedData[sortedData.length - 1].time_period,
    firstValue,
    lastValue,
    percentChange,
    trend
  };
  
  // Identify significant changes between consecutive periods
  for (let i = 1; i < sortedData.length; i++) {
    const prevValue = sortedData[i-1].count;
    const currValue = sortedData[i].count;
    
    if (prevValue === 0) continue;
    
    const change = ((currValue - prevValue) / prevValue * 100).toFixed(1);
    
    if (Math.abs(parseFloat(change)) >= 20) {
      results.significantChanges.push({
        period: sortedData[i].time_period,
        previousPeriod: sortedData[i-1].time_period,
        previousValue: prevValue,
        currentValue: currValue,
        percentChange: change,
        direction: parseFloat(change) >= 0 ? 'increase' : 'decrease'
      });
    }
  }
  
  // Calculate moving average (3-period)
  const movingAverage = [];
  for (let i = 2; i < sortedData.length; i++) {
    const avg = (sortedData[i].count + sortedData[i-1].count + sortedData[i-2].count) / 3;
    movingAverage.push({
      date: sortedData[i].time_period,
      value: avg
    });
  }
  
  // Check for seasonality (very basic)
  if (sortedData.length >= 24) { // Need at least 2 years of data
    const monthlyAverages = Array(12).fill(0);
    const monthCounts = Array(12).fill(0);
    
    sortedData.forEach(item => {
      const date = new Date(item.time_period);
      const month = date.getMonth();
      monthlyAverages[month] += item.count;
      monthCounts[month]++;
    });
    
    for (let i = 0; i < 12; i++) {
      if (monthCounts[i] > 0) {
        monthlyAverages[i] /= monthCounts[i];
      }
    }
    
    const avgValue = monthlyAverages.reduce((sum, val) => sum + val, 0) / monthlyAverages.filter(v => v > 0).length;
    
    // Find months with significant deviation from average
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    const seasonalMonths = [];
    
    monthlyAverages.forEach((value, month) => {
      if (value === 0) return;
      
      const deviation = ((value - avgValue) / avgValue * 100).toFixed(1);
      
      if (Math.abs(parseFloat(deviation)) >= 20) {
        seasonalMonths.push({
          month: monthNames[month],
          deviation: `${deviation}%`,
          direction: parseFloat(deviation) >= 0 ? 'above average' : 'below average'
        });
      }
    });
    
    if (seasonalMonths.length > 0) {
      results.timeSeriesAnalysis.seasonality = `Seasonal pattern detected with ${seasonalMonths.map(m => `${m.month} (${m.deviation} ${m.direction})`).join(', ')}`;
    } else {
      results.timeSeriesAnalysis.seasonality = 'No clear seasonal pattern detected';
    }
  } else {
    results.timeSeriesAnalysis.seasonality = 'insufficient data for seasonality analysis';
  }
  
  // Prepare data for trend line visualization
  results.visualizationData.trendLine = sortedData.map(item => ({
    date: item.time_period,
    value: item.count
  }));
  
  // Prepare data for moving average visualization
  results.visualizationData.movingAverage = movingAverage;
  
  // Prepare data for year-over-year comparison if possible
  if (sortedData.length >= 13) {
    const yearOverYearComparison = [];
    
    for (let i = 12; i < sortedData.length; i++) {
      yearOverYearComparison.push({
        date: new Date(sortedData[i].time_period).toLocaleDateString('en-US', { month: 'short' }),
        currentValue: sortedData[i].count,
        previousValue: sortedData[i-12].count
      });
    }
    
    results.visualizationData.yearOverYearComparison = yearOverYearComparison;
  }
  
  return results;
}

/**
 * Analyze violation data
 * @param {Object} retrievedData - Violation data
 * @param {Object} structuredQuery - The structured query
 * @returns {Object} Violation analysis results
 */
function analyzeViolationData(retrievedData, structuredQuery) {
  const results = {
    violationStats: {},
    topViolationTypes: [],
    buildingsWithMultipleViolations: [],
    visualizationData: {}
  };
  
  if (!retrievedData || !retrievedData.data || !Array.isArray(retrievedData.data)) {
    return results;
  }
  
  const data = retrievedData.data;
  
  // Count violations by source
  const violationsBySource = {};
  data.forEach(violation => {
    const source = violation.source || 'Unknown';
    violationsBySource[source] = (violationsBySource[source] || 0) + 1;
  });
  
  results.violationStats.violationsBySource = violationsBySource;
  
  // Count violations by status
  const violationsByStatus = {};
  data.forEach(violation => {
    const status = violation.violationstatus || 'Unknown';
    violationsByStatus[status] = (violationsByStatus[status] || 0) + 1;
  });
  
  results.violationStats.violationsByStatus = violationsByStatus;
  
  // Count violations by type
  const violationsByType = {};
  data.forEach(violation => {
    const type = violation.violationtype || 'Unknown';
    violationsByType[type] = (violationsByType[type] || 0) + 1;
  });
  
  // Get top violation types
  results.topViolationTypes = Object.entries(violationsByType)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  // Count violations by building
  const violationsByBuilding = {};
  data.forEach(violation => {
    const bbl = violation.bbl;
    if (!bbl) return;
    
    if (!violationsByBuilding[bbl]) {
      violationsByBuilding[bbl] = {
        bbl,
        address: violation.address,
        borough: violation.borough,
        violationCount: 0,
        violations: []
      };
    }
    
    violationsByBuilding[bbl].violationCount++;
    violationsByBuilding[bbl].violations.push({
      id: violation.violationid,
      type: violation.violationtype,
      status: violation.violationstatus,
      date: violation.issueddate,
      source: violation.source
    });
  });
  
  // Get buildings with multiple violations
  results.buildingsWithMultipleViolations = Object.values(violationsByBuilding)
    .filter(building => building.violationCount > 1)
    .sort((a, b) => b.violationC<response clipped><NOTE>To save on context only part of this file has been shown to you. You should retry this tool after you have searched inside the file with `grep -n` in order to find the line numbers of what you are looking for.</NOTE>