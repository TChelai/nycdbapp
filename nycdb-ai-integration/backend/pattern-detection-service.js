/**
 * Pattern Detection Service for NYCDB AI Integration
 * 
 * This service identifies patterns, anomalies, and significant features in the data
 * to provide deeper insights beyond basic statistics.
 */

/**
 * Detect patterns and anomalies in the data
 * @param {Object} structuredQuery - The structured query from NLP service
 * @param {Object} analysisResults - Results from data analysis
 * @returns {Object} Detected patterns and anomalies
 */
function detectPatterns(structuredQuery, analysisResults) {
  // Select pattern detection method based on query type
  let patterns = {};
  
  switch (structuredQuery.queryType) {
    case 'risk_assessment':
      patterns = detectRiskPatterns(analysisResults);
      break;
    case 'trend_analysis':
      patterns = detectTrendPatterns(analysisResults);
      break;
    case 'violation_search':
      patterns = detectViolationPatterns(analysisResults);
      break;
    case 'building_lookup':
      patterns = detectBuildingPatterns(analysisResults);
      break;
    case 'comparison':
      patterns = detectComparisonPatterns(analysisResults);
      break;
    case 'general_stats':
      patterns = detectGeneralStatsPatterns(analysisResults);
      break;
    default:
      patterns = detectGenericPatterns(analysisResults);
  }
  
  return patterns;
}

/**
 * Detect patterns in risk assessment data
 * @param {Object} analysisResults - Risk assessment results
 * @returns {Object} Detected patterns
 */
function detectRiskPatterns(analysisResults) {
  const patterns = {
    significantPatterns: [],
    anomalies: [],
    clusters: []
  };
  
  // Extract relevant data
  const { riskStats, highRiskPatterns, topRiskBuildings } = analysisResults;
  
  // Check if there's a concentration of high-risk buildings in specific areas
  if (highRiskPatterns && highRiskPatterns.commonFactors) {
    highRiskPatterns.commonFactors.forEach(factor => {
      if (factor.factor === 'Borough' && parseFloat(factor.percentage) > 40) {
        patterns.significantPatterns.push({
          type: 'geographic_concentration',
          description: `${factor.percentage}% of high-risk buildings are concentrated in ${factor.value}`,
          importance: 'high',
          data: {
            location: factor.value,
            percentage: factor.percentage,
            count: factor.count
          }
        });
      }
      
      if (factor.factor === 'Age Range' && parseFloat(factor.percentage) > 50) {
        patterns.significantPatterns.push({
          type: 'age_concentration',
          description: `${factor.percentage}% of high-risk buildings are from the ${factor.value} era`,
          importance: 'high',
          data: {
            ageRange: factor.value,
            percentage: factor.percentage,
            count: factor.count
          }
        });
      }
      
      if (factor.factor === 'Building Class' && parseFloat(factor.percentage) > 30) {
        patterns.significantPatterns.push({
          type: 'building_type_concentration',
          description: `${factor.percentage}% of high-risk buildings are of class ${factor.value}`,
          importance: 'medium',
          data: {
            buildingClass: factor.value,
            percentage: factor.percentage,
            count: factor.count
          }
        });
      }
    });
  }
  
  // Check for anomalies in the risk scores
  if (topRiskBuildings && topRiskBuildings.length > 0) {
    // Find buildings with unusually high risk scores
    const highRiskScoreThreshold = 90;
    const buildingsWithVeryHighRisk = topRiskBuildings.filter(b => b.risk_score > highRiskScoreThreshold);
    
    if (buildingsWithVeryHighRisk.length > 0) {
      patterns.anomalies.push({
        type: 'extreme_risk_score',
        description: `${buildingsWithVeryHighRisk.length} buildings have extremely high risk scores (>90)`,
        importance: 'high',
        data: {
          count: buildingsWithVeryHighRisk.length,
          buildings: buildingsWithVeryHighRisk.map(b => ({
            address: b.address,
            borough: b.borough,
            riskScore: b.risk_score
          }))
        }
      });
    }
    
    // Find buildings with high risk despite being relatively new
    const newBuildingsWithHighRisk = topRiskBuildings.filter(b => 
      b.risk_level === 'High' && b.yearbuilt > 2000
    );
    
    if (newBuildingsWithHighRisk.length > 0) {
      patterns.anomalies.push({
        type: 'new_building_high_risk',
        description: `${newBuildingsWithHighRisk.length} buildings built after 2000 have high risk scores`,
        importance: 'high',
        data: {
          count: newBuildingsWithHighRisk.length,
          buildings: newBuildingsWithHighRisk.map(b => ({
            address: b.address,
            borough: b.borough,
            yearBuilt: b.yearbuilt,
            riskScore: b.risk_score
          }))
        }
      });
    }
  }
  
  return patterns;
}

/**
 * Detect patterns in trend analysis data
 * @param {Object} analysisResults - Trend analysis results
 * @returns {Object} Detected patterns
 */
function detectTrendPatterns(analysisResults) {
  const patterns = {
    significantPatterns: [],
    anomalies: [],
    seasonality: null
  };
  
  // Extract relevant data
  const { trendStats, significantChanges, timeSeriesAnalysis, visualizationData } = analysisResults;
  
  // Check for overall trend
  if (trendStats && trendStats.trend) {
    patterns.significantPatterns.push({
      type: 'overall_trend',
      description: `Overall ${trendStats.trend} trend with ${trendStats.percentChange}% change`,
      importance: 'high',
      data: {
        trend: trendStats.trend,
        percentChange: trendStats.percentChange
      }
    });
  }
  
  // Check for significant changes
  if (significantChanges && significantChanges.length > 0) {
    // Find the most significant change
    const mostSignificantChange = significantChanges.reduce((prev, current) => {
      return Math.abs(parseFloat(prev.percentChange)) > Math.abs(parseFloat(current.percentChange)) ? prev : current;
    });
    
    patterns.anomalies.push({
      type: 'significant_change',
      description: `${mostSignificantChange.direction === 'increase' ? 'Increase' : 'Decrease'} of ${Math.abs(parseFloat(mostSignificantChange.percentChange))}% on ${new Date(mostSignificantChange.period).toLocaleDateString()}`,
      importance: 'high',
      data: mostSignificantChange
    });
    
    // Check for multiple consecutive increases or decreases
    let consecutiveIncreases = 0;
    let consecutiveDecreases = 0;
    let maxConsecutiveIncreases = 0;
    let maxConsecutiveDecreases = 0;
    
    significantChanges.forEach(change => {
      if (change.direction === 'increase') {
        consecutiveIncreases++;
        consecutiveDecreases = 0;
        maxConsecutiveIncreases = Math.max(maxConsecutiveIncreases, consecutiveIncreases);
      } else {
        consecutiveDecreases++;
        consecutiveIncreases = 0;
        maxConsecutiveDecreases = Math.max(maxConsecutiveDecreases, consecutiveDecreases);
      }
    });
    
    if (maxConsecutiveIncreases >= 3) {
      patterns.significantPatterns.push({
        type: 'consecutive_increases',
        description: `${maxConsecutiveIncreases} consecutive periods of significant increases`,
        importance: 'medium',
        data: {
          count: maxConsecutiveIncreases
        }
      });
    }
    
    if (maxConsecutiveDecreases >= 3) {
      patterns.significantPatterns.push({
        type: 'consecutive_decreases',
        description: `${maxConsecutiveDecreases} consecutive periods of significant decreases`,
        importance: 'medium',
        data: {
          count: maxConsecutiveDecreases
        }
      });
    }
  }
  
  // Check for seasonality
  if (timeSeriesAnalysis && timeSeriesAnalysis.seasonality) {
    if (timeSeriesAnalysis.seasonality !== 'none detected' && 
        timeSeriesAnalysis.seasonality !== 'insufficient data') {
      patterns.seasonality = {
        type: 'seasonal_pattern',
        description: timeSeriesAnalysis.seasonality,
        importance: 'medium',
        data: {
          pattern: timeSeriesAnalysis.seasonality
        }
      };
    }
  }
  
  return patterns;
}

/**
 * Detect patterns in violation data
 * @param {Object} analysisResults - Violation search results
 * @returns {Object} Detected patterns
 */
function detectViolationPatterns(analysisResults) {
  const patterns = {
    significantPatterns: [],
    anomalies: [],
    clusters: []
  };
  
  // Extract relevant data
  const { violationStats, topViolationTypes, buildingsWithMultipleViolations } = analysisResults;
  
  // Check for dominant violation types
  if (topViolationTypes && topViolationTypes.length > 0) {
    const totalViolations = violationStats.totalViolations || 
      topViolationTypes.reduce((sum, type) => sum + type.count, 0);
    
    const dominantType = topViolationTypes[0];
    const dominantPercentage = ((dominantType.count / totalViolations) * 100).toFixed(1);
    
    if (parseFloat(dominantPercentage) > 30) {
      patterns.significantPatterns.push({
        type: 'dominant_violation_type',
        description: `${dominantType.type} accounts for ${dominantPercentage}% of all violations`,
        importance: 'high',
        data: {
          violationType: dominantType.type,
          count: dominantType.count,
          percentage: dominantPercentage
        }
      });
    }
  }
  
  // Check for buildings with unusually high violation counts
  if (buildingsWithMultipleViolations && buildingsWithMultipleViolations.length > 0) {
    // Find the average violation count
    const avgViolations = buildingsWithMultipleViolations.reduce((sum, b) => sum + b.violationCount, 0) / 
      buildingsWithMultipleViolations.length;
    
    // Find buildings with violation counts significantly above average
    const highViolationThreshold = avgViolations * 2;
    const buildingsWithHighViolations = buildingsWithMultipleViolations.filter(b => 
      b.violationCount > highViolationThreshold
    );
    
    if (buildingsWithHighViolations.length > 0) {
      patterns.anomalies.push({
        type: 'high_violation_count',
        description: `${buildingsWithHighViolations.length} buildings have violation counts more than twice the average`,
        importance: 'high',
        data: {
          count: buildingsWithHighViolations.length,
          buildings: buildingsWithHighViolations.map(b => ({
            address: b.address,
            borough: b.borough,
            violationCount: b.violationCount
          })),
          averageViolations: avgViolations.toFixed(1)
        }
      });
    }
  }
  
  // Check for geographic clusters of violations
  if (buildingsWithMultipleViolations && buildingsWithMultipleViolations.length > 0) {
    const violationsByBorough = {};
    
    buildingsWithMultipleViolations.forEach(building => {
      const borough = building.borough;
      if (!violationsByBorough[borough]) {
        violationsByBorough[borough] = {
          buildingCount: 0,
          violationCount: 0
        };
      }
      
      violationsByBorough[borough].buildingCount++;
      violationsByBorough[borough].violationCount += building.violationCount;
    });
    
    // Find boroughs with high concentration of violations
    Object.entries(violationsByBorough).forEach(([borough, stats]) => {
      const totalBuildings = buildingsWithMultipleViolations.length;
      const totalViolations = buildingsWithMultipleViolations.reduce((sum, b) => sum + b.violationCount, 0);
      
      const buildingPercentage = ((stats.buildingCount / totalBuildings) * 100).toFixed(1);
      const violationPercentage = ((stats.violationCount / totalViolations) * 100).toFixed(1);
      
      // If violation percentage is significantly higher than building percentage, it's a cluster
      if (parseFloat(violationPercentage) > parseFloat(buildingPercentage) * 1.5) {
        patterns.clusters.push({
          type: 'violation_cluster',
          description: `${borough} has ${violationPercentage}% of violations but only ${buildingPercentage}% of buildings`,
          importance: 'medium',
          data: {
            borough,
            buildingCount: stats.buildingCount,
            buildingPercentage,
            violationCount: stats.violationCount,
            violationPercentage
          }
        });
      }
    });
  }
  
  return patterns;
}

/**
 * Detect patterns in building data
 * @param {Object} analysisResults - Building lookup results
 * @returns {Object} Detected patterns
 */
function detectBuildingPatterns(analysisResults) {
  const patterns = {
    significantPatterns: [],
    anomalies: [],
    distributions: {}
  };
  
  // Extract relevant data
  const { buildingStats, visualizationData, buildings } = analysisResults;
  
  // Check for unusual building age distribution
  if (visualizationData && visualizationData.buildingsByAge) {
    const ageDistribution = visualizationData.buildingsByAge;
    const totalBuildings = ageDistribution.reduce((sum, item) => sum + item.value, 0);
    
    // Check if any age range has more than 50% of buildings
    ageDistribution.forEach(ageRange => {
      const percentage = ((ageRange.value / totalBuildings) * 100).toFixed(1);
      
      if (parseFloat(percentage) > 50) {
        patterns.significantPatterns.push({
          type: 'age_concentration',
          description: `${percentage}% of buildings are from the ${ageRange.category} era`,
          importance: 'medium',
          data: {
            ageRange: ageRange.category,
            count: ageRange.value,
            percentage
          }
        });
      }
    });
    
    patterns.distributions.ageDistribution = {
      data: ageDistribution,
      totalBuildings
    };
  }
  
  // Check for unusual building type distribution
  if (visualizationData && visualizationData.buildingsByType) {
    const typeDistribution = visualizationData.buildingsByType;
    const totalBuildings = typeDistribution.reduce((sum, item) => sum + item.value, 0);
    
    // Check if any building type has more than 40% of buildings
    typeDistribution.forEach(buildingType => {
      const percentage = ((buildingType.value / totalBuildings) * 100).toFixed(1);
      
      if (parseFloat(percentage) > 40) {
        patterns.significantPatterns.push({
          type: 'building_type_concentration',
          description: `${percentage}% of buildings are of type ${buildingType.category}`,
          importance: 'medium',
          data: {
            buildingType: buildingType.category,
            count: buildingType.value,
            percentage
          }
        });
      }
    });
    
    patterns.distributions.typeDistribution = {
      data: typeDistribution,
      totalBuildings
    };
  }
  
  // Check for anomalies in building data
  if (buildings && buildings.length > 0) {
    // Find unusually tall buildings
    const avgFloors = parseFloat(buildingStats.averageFloors);
    const tallBuildingThreshold = avgFloors * 2;
    
    const tallBuildings = buildings.filter(b => b.numfloors > tallBuildingThreshold);
    
    if (tallBuildings.length > 0) {
      patterns.anomalies.push({
        type: 'unusually_tall_buildings',
        description: `${tallBuildings.length} buildings are more than twice as tall as the average (${avgFloors.toFixed(1)} floors)`,
        importance: 'low',
        data: {
          count: tallBuildings.length,
          buildings: tallBuildings.map(b => ({
            address: b.address,
            borough: b.borough,
            floors: b.numfloors
          })),
          averageFloors: avgFloors
        }
      });
    }
    
    // Find buildings with unusually high unit counts
    const avgUnits = parseFloat(buildingStats.averageUnits);
    const highUnitThreshold = avgUnits * 3;
    
    const highUnitBuildings = buildings.filter(b => b.unitsres > highUn<response clipped><NOTE>To save on context only part of this file has been shown to you. You should retry this tool after you have searched inside the file with `grep -n` in order to find the line numbers of what you are looking for.</NOTE>