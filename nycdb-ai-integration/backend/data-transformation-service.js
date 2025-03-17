/**
 * Data Transformation Service for NYCDB AI Integration
 * 
 * This service handles the transformation of raw database data into formats
 * suitable for analysis and visualization.
 */

/**
 * Transform raw database results into a standardized format
 * @param {Object} rawData - Raw data from database
 * @param {string} queryType - Type of query
 * @returns {Object} Transformed data
 */
function transformQueryResults(rawData, queryType) {
  // Handle empty results
  if (!rawData || !rawData.rows || rawData.rows.length === 0) {
    return {
      data: [],
      metadata: {
        count: 0,
        queryType,
        timestamp: new Date().toISOString()
      }
    };
  }
  
  // Select transformation method based on query type
  let transformedData;
  switch (queryType) {
    case 'risk_assessment':
      transformedData = transformRiskAssessmentData(rawData.rows);
      break;
    case 'trend_analysis':
      transformedData = transformTrendAnalysisData(rawData.rows);
      break;
    case 'violation_search':
      transformedData = transformViolationData(rawData.rows);
      break;
    case 'building_lookup':
      transformedData = transformBuildingData(rawData.rows);
      break;
    case 'comparison':
      transformedData = transformComparisonData(rawData.rows);
      break;
    case 'general_stats':
      transformedData = transformGeneralStatsData(rawData.rows);
      break;
    default:
      transformedData = {
        data: rawData.rows,
        metadata: {
          count: rawData.rows.length,
          queryType: 'generic',
          timestamp: new Date().toISOString()
        }
      };
  }
  
  return transformedData;
}

/**
 * Transform risk assessment data
 * @param {Array} rows - Database result rows
 * @returns {Object} Transformed risk assessment data
 */
function transformRiskAssessmentData(rows) {
  // Calculate risk scores for each building
  const data = rows.map(building => {
    const ageScore = calculateBuildingAgeScore(building.yearbuilt);
    const violationScore = calculateViolationScore(building.total_violations);
    const riskScore = (ageScore + violationScore) / 2;
    
    return {
      ...building,
      age_score: ageScore,
      violation_score: violationScore,
      risk_score: riskScore,
      risk_level: getRiskLevel(riskScore)
    };
  });
  
  return {
    data,
    metadata: {
      count: data.length,
      queryType: 'risk_assessment',
      timestamp: new Date().toISOString(),
      highRiskCount: data.filter(b => b.risk_level === 'High').length,
      mediumRiskCount: data.filter(b => b.risk_level === 'Medium').length,
      lowRiskCount: data.filter(b => b.risk_level === 'Low').length,
      minimalRiskCount: data.filter(b => b.risk_level === 'Minimal').length
    }
  };
}

/**
 * Transform trend analysis data
 * @param {Array} rows - Database result rows
 * @returns {Object} Transformed trend analysis data
 */
function transformTrendAnalysisData(rows) {
  // Sort data by time period
  const sortedData = [...rows].sort((a, b) => {
    return new Date(a.time_period) - new Date(b.time_period);
  });
  
  // Extract time range
  const timeRange = {
    start: sortedData.length > 0 ? sortedData[0].time_period : null,
    end: sortedData.length > 0 ? sortedData[sortedData.length - 1].time_period : null
  };
  
  return {
    data: sortedData,
    timeRange,
    metadata: {
      count: sortedData.length,
      queryType: 'trend_analysis',
      timestamp: new Date().toISOString(),
      timeRange
    }
  };
}

/**
 * Transform violation data
 * @param {Array} rows - Database result rows
 * @returns {Object} Transformed violation data
 */
function transformViolationData(rows) {
  // Count violations by status and source
  const violationsByStatus = {};
  const violationsBySource = {};
  
  rows.forEach(violation => {
    const status = violation.violationstatus || 'Unknown';
    violationsByStatus[status] = (violationsByStatus[status] || 0) + 1;
    
    const source = violation.source || 'Unknown';
    violationsBySource[source] = (violationsBySource[source] || 0) + 1;
  });
  
  return {
    data: rows,
    metadata: {
      count: rows.length,
      queryType: 'violation_search',
      timestamp: new Date().toISOString(),
      violationsByStatus,
      violationsBySource
    }
  };
}

/**
 * Transform building data
 * @param {Array} rows - Database result rows
 * @returns {Object} Transformed building data
 */
function transformBuildingData(rows) {
  // Calculate average values
  const avgYearBuilt = calculateAverage(rows, 'yearbuilt');
  const avgFloors = calculateAverage(rows, 'numfloors');
  const avgUnits = calculateAverage(rows, 'unitsres');
  
  // Count building types
  const buildingTypes = {};
  rows.forEach(building => {
    const type = building.bldgclass || 'Unknown';
    buildingTypes[type] = (buildingTypes[type] || 0) + 1;
  });
  
  return {
    data: rows,
    metadata: {
      count: rows.length,
      queryType: 'building_lookup',
      timestamp: new Date().toISOString(),
      avgYearBuilt,
      avgFloors,
      avgUnits,
      buildingTypes
    }
  };
}

/**
 * Transform comparison data
 * @param {Array} rows - Database result rows
 * @returns {Object} Transformed comparison data
 */
function transformComparisonData(rows) {
  // Determine the comparison category (first column)
  const firstKey = rows.length > 0 ? Object.keys(rows[0])[0] : null;
  
  return {
    data: rows,
    comparisonBy: firstKey,
    metadata: {
      count: rows.length,
      queryType: 'comparison',
      timestamp: new Date().toISOString(),
      comparisonBy: firstKey
    }
  };
}

/**
 * Transform general statistics data
 * @param {Array} rows - Database result rows
 * @returns {Object} Transformed general statistics data
 */
function transformGeneralStatsData(rows) {
  // General stats typically has just one row with aggregate data
  const data = rows.length > 0 ? rows[0] : {};
  
  // Calculate derived statistics
  const derivedStats = {
    averageUnitsPerBuilding: data.total_residential_units / data.total_buildings,
    violationsPerBuilding: (data.total_hpd_violations + data.total_dob_violations) / data.total_buildings,
    buildingAgeRange: data.newest_building - data.oldest_building,
    averageBuildingAge: new Date().getFullYear() - data.avg_year_built
  };
  
  return {
    data,
    derivedStats,
    metadata: {
      queryType: 'general_stats',
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Calculate a risk score based on building age
 * @param {number} yearBuilt - Year the building was built
 * @returns {number} Age risk score (0-100)
 */
function calculateBuildingAgeScore(yearBuilt) {
  const currentYear = new Date().getFullYear();
  const age = currentYear - yearBuilt;
  
  // Buildings over 100 years old get highest risk score
  if (age >= 100) return 100;
  
  // Buildings under 10 years old get lowest risk score
  if (age <= 10) return 10;
  
  // Linear scale between 10 and 100
  return Math.round((age - 10) * (90 / 90) + 10);
}

/**
 * Calculate a risk score based on violation count
 * @param {number} violationCount - Number of violations
 * @returns {number} Violation risk score (0-100)
 */
function calculateViolationScore(violationCount) {
  // 0 violations = 0 score
  if (violationCount === 0) return 0;
  
  // 20+ violations = 100 score
  if (violationCount >= 20) return 100;
  
  // Linear scale between 0 and 20
  return Math.round(violationCount * 5);
}

/**
 * Get risk level label based on risk score
 * @param {number} score - Risk score (0-100)
 * @returns {string} Risk level label
 */
function getRiskLevel(score) {
  if (score >= 80) return 'High';
  if (score >= 50) return 'Medium';
  if (score >= 20) return 'Low';
  return 'Minimal';
}

/**
 * Calculate average of a property across objects
 * @param {Array} data - Array of objects
 * @param {string} property - Property to average
 * @returns {number} Average value
 */
function calculateAverage(data, property) {
  if (data.length === 0) return 0;
  
  const sum = data.reduce((total, item) => {
    const value = parseFloat(item[property]);
    return total + (isNaN(value) ? 0 : value);
  }, 0);
  
  return (sum / data.length).toFixed(2);
}

module.exports = {
  transformQueryResults
};
