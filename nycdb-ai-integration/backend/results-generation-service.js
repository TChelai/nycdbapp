/**
 * Results Generation Service for NYCDB AI Integration
 * 
 * This service transforms analysis results into human-readable insights and visualizations
 * to be presented to the user in response to their natural language query.
 */

const { QUERY_TYPES } = require('./nlp-service');

/**
 * Generate a complete response to the user's query
 * @param {Object} structuredQuery - The structured query from NLP service
 * @param {Object} retrievedData - Data retrieved from the database
 * @param {Object} analysisResults - Results from the AI analysis
 * @returns {Object} Complete response with text, visualizations, and data
 */
function generateResponse(structuredQuery, retrievedData, analysisResults) {
  try {
    // Select response generator based on query type
    let response;
    switch (structuredQuery.queryType) {
      case QUERY_TYPES.RISK_ASSESSMENT:
        response = generateRiskAssessmentResponse(structuredQuery, retrievedData, analysisResults);
        break;
      case QUERY_TYPES.TREND_ANALYSIS:
        response = generateTrendAnalysisResponse(structuredQuery, retrievedData, analysisResults);
        break;
      case QUERY_TYPES.VIOLATION_SEARCH:
        response = generateViolationSearchResponse(structuredQuery, retrievedData, analysisResults);
        break;
      case QUERY_TYPES.BUILDING_LOOKUP:
        response = generateBuildingLookupResponse(structuredQuery, retrievedData, analysisResults);
        break;
      case QUERY_TYPES.COMPARISON:
        response = generateComparisonResponse(structuredQuery, retrievedData, analysisResults);
        break;
      case QUERY_TYPES.GENERAL_STATS:
        response = generateGeneralStatsResponse(structuredQuery, retrievedData, analysisResults);
        break;
      default:
        response = generateGeneralResponse(structuredQuery, retrievedData, analysisResults);
    }
    
    // Add common response elements
    response.originalQuery = structuredQuery.originalQuery;
    response.queryType = structuredQuery.queryType;
    response.timestamp = new Date().toISOString();
    response.confidence = analysisResults.narrativeInsights?.confidence || 0.7;
    
    // Add refinement suggestions
    response.refinementSuggestions = generateRefinementSuggestions(
      structuredQuery, 
      retrievedData, 
      analysisResults
    );
    
    return response;
  } catch (error) {
    console.error('Error generating response:', error);
    return {
      text: "I'm sorry, I encountered an error while generating your response. Please try a different query.",
      originalQuery: structuredQuery.originalQuery,
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
}

/**
 * Generate response for risk assessment queries
 * @param {Object} structuredQuery - The structured query
 * @param {Object} retrievedData - Retrieved data
 * @param {Object} analysisResults - Analysis results
 * @returns {Object} Formatted response
 */
function generateRiskAssessmentResponse(structuredQuery, retrievedData, analysisResults) {
  const { riskStats, highRiskPatterns, visualizationData, topRiskBuildings } = analysisResults;
  const { narrativeInsights } = analysisResults;
  
  // Format the main response text
  let responseText = `# Building Risk Assessment\n\n`;
  
  // Add summary from narrative insights
  if (narrativeInsights && narrativeInsights.summary) {
    responseText += `## Summary\n\n${narrativeInsights.summary}\n\n`;
  } else {
    responseText += `## Summary\n\n`;
    responseText += `I analyzed ${riskStats.totalBuildings} buildings `;
    
    if (structuredQuery.entities.locations && structuredQuery.entities.locations.length > 0) {
      responseText += `in ${structuredQuery.entities.locations.join(', ')} `;
    }
    
    responseText += `for potential structural risks.\n\n`;
    responseText += `**${riskStats.highRiskCount} buildings (${riskStats.highRiskPercentage}%)** were identified as high risk, `;
    responseText += `and **${riskStats.mediumRiskCount} buildings (${riskStats.mediumRiskPercentage}%)** were identified as medium risk.\n\n`;
    
    // Add information about risk factors
    if (riskStats.topRiskFactors && riskStats.topRiskFactors.length > 0) {
      responseText += `The top risk factors are:\n\n`;
      riskStats.topRiskFactors.forEach(factor => {
        responseText += `- **${factor.factor}**: Found in ${factor.count} buildings (${factor.percentage}%)\n`;
      });
      responseText += `\n`;
    }
  }
  
  // Add key findings section
  responseText += `## Key Findings\n\n`;
  
  if (narrativeInsights && narrativeInsights.keyFindings && narrativeInsights.keyFindings.length > 0) {
    narrativeInsights.keyFindings.forEach(finding => {
      responseText += `- ${finding}\n`;
    });
  } else {
    // Default key findings if AI didn't generate any
    if (highRiskPatterns && highRiskPatterns.commonFactors) {
      highRiskPatterns.commonFactors.forEach(factor => {
        responseText += `- ${factor.percentage}% of high-risk buildings are in the **${factor.value}** ${factor.factor} category\n`;
      });
    }
    
    if (topRiskBuildings && topRiskBuildings.length > 0) {
      responseText += `- The highest risk building is located at **${topRiskBuildings[0].address}** with a risk score of ${topRiskBuildings[0].risk_score.toFixed(1)}\n`;
    }
  }
  
  responseText += `\n## High Risk Buildings\n\n`;
  
  if (topRiskBuildings && topRiskBuildings.length > 0) {
    responseText += `| Address | Borough | Year Built | Risk Score | Risk Level |\n`;
    responseText += `| ------- | ------- | ---------- | ---------- | ---------- |\n`;
    
    topRiskBuildings.slice(0, 5).forEach(building => {
      responseText += `| ${building.address} | ${building.borough} | ${building.yearbuilt} | ${building.risk_score.toFixed(1)} | ${building.risk_level} |\n`;
    });
    
    responseText += `\n*Showing ${Math.min(5, topRiskBuildings.length)} of ${topRiskBuildings.length} high risk buildings*\n\n`;
  } else {
    responseText += `No high risk buildings were found in this dataset.\n\n`;
  }
  
  // Add explanations if available
  if (narrativeInsights && narrativeInsights.explanations && narrativeInsights.explanations.length > 0) {
    responseText += `## Explanations\n\n`;
    narrativeInsights.explanations.forEach(explanation => {
      responseText += `- ${explanation}\n`;
    });
    responseText += `\n`;
  }
  
  // Prepare visualization configurations
  const visualizations = [];
  
  if (visualizationData && visualizationData.riskDistribution) {
    visualizations.push({
      type: 'pieChart',
      title: 'Risk Level Distribution',
      data: visualizationData.riskDistribution,
      config: {
        colors: ['#d9534f', '#f0ad4e', '#5bc0de', '#5cb85c'],
        labels: {
          categoryKey: 'category',
          valueKey: 'value'
        }
      }
    });
  }
  
  if (visualizationData && visualizationData.riskByBorough) {
    visualizations.push({
      type: 'barChart',
      title: 'High Risk Buildings by Borough',
      data: visualizationData.riskByBorough.map(item => ({
        category: item.borough,
        value: item.highRiskCount
      })),
      config: {
        labels: {
          categoryKey: 'category',
          valueKey: 'value'
        },
        xAxisLabel: 'Borough',
        yAxisLabel: 'Number of High Risk Buildings'
      }
    });
  }
  
  return {
    text: responseText,
    visualizations,
    data: {
      riskStats,
      highRiskPatterns,
      topRiskBuildings: topRiskBuildings ? topRiskBuildings.slice(0, 10) : []
    }
  };
}

/**
 * Generate response for trend analysis queries
 * @param {Object} structuredQuery - The structured query
 * @param {Object} retrievedData - Retrieved data
 * @param {Object} analysisResults - Analysis results
 * @returns {Object} Formatted response
 */
function generateTrendAnalysisResponse(structuredQuery, retrievedData, analysisResults) {
  const { trendStats, significantChanges, timeSeriesAnalysis, visualizationData, timeRange } = analysisResults;
  const { narrativeInsights } = analysisResults;
  
  // Format the main response text
  let responseText = `# Trend Analysis\n\n`;
  
  // Add summary from narrative insights
  if (narrativeInsights && narrativeInsights.summary) {
    responseText += `## Summary\n\n${narrativeInsights.summary}\n\n`;
  } else {
    responseText += `## Summary\n\n`;
    responseText += `I analyzed trends `;
    
    if (structuredQuery.entities.locations && structuredQuery.entities.locations.length > 0) {
      responseText += `in ${structuredQuery.entities.locations.join(', ')} `;
    }
    
    if (timeRange) {
      responseText += `from ${timeRange.start} to ${timeRange.end}.\n\n`;
    } else {
      responseText += `over the available time period.\n\n`;
    }
    
    responseText += `The overall trend is **${trendStats.trend}** `;
    if (trendStats.percentChange) {
      const changeDirection = parseFloat(trendStats.percentChange) >= 0 ? 'increase' : 'decrease';
      responseText += `with a ${Math.abs(parseFloat(trendStats.percentChange))}% ${changeDirection} `;
    }
    responseText += `over the analyzed period.\n\n`;
    
    if (timeSeriesAnalysis && timeSeriesAnalysis.seasonality) {
      responseText += `Seasonality analysis: ${timeSeriesAnalysis.seasonality}.\n\n`;
    }
  }
  
  // Add key findings section
  responseText += `## Key Findings\n\n`;
  
  if (narrativeInsights && narrativeInsights.keyFindings && narrativeInsights.keyFindings.length > 0) {
    narrativeInsights.keyFindings.forEach(finding => {
      responseText += `- ${finding}\n`;
    });
  } else {
    // Default key findings if AI didn't generate any
    responseText += `- Total count over the period: **${trendStats.totalCount}**\n`;
    responseText += `- Average per time period: **${trendStats.averagePerPeriod.toFixed(1)}**\n`;
    
    if (timeSeriesAnalysis) {
      responseText += `- First half average: **${timeSeriesAnalysis.firstHalfAverage.toFixed(1)}**\n`;
      responseText += `- Second half average: **${timeSeriesAnalysis.secondHalfAverage.toFixed(1)}**\n`;
      responseText += `- Percent change: **${timeSeriesAnalysis.percentChange}%**\n`;
    }
  }
  
  // Add significant changes if available
  if (significantChanges && significantChanges.length > 0) {
    responseText += `\n## Significant Changes\n\n`;
    
    significantChanges.forEach(change => {
      responseText += `- **${change.period}**: ${change.percentChange}% ${change.direction} from previous period\n`;
    });
    
    responseText += `\n`;
  }
  
  // Add explanations if available
  if (narrativeInsights && narrativeInsights.explanations && narrativeInsights.explanations.length > 0) {
    responseText += `## Explanations\n\n`;
    narrativeInsights.explanations.forEach(explanation => {
      responseText += `- ${explanation}\n`;
    });
    responseText += `\n`;
  }
  
  // Prepare visualization configurations
  const visualizations = [];
  
  if (visualizationData && visualizationData.trendLine) {
    visualizations.push({
      type: 'lineChart',
      title: 'Trend Over Time',
      data: visualizationData.trendLine,
      config: {
        labels: {
          categoryKey: 'date',
          valueKey: 'value'
        },
        xAxisLabel: 'Date',
        yAxisLabel: 'Count'
      }
    });
  }
  
  if (visualizationData && visualizationData.movingAverage) {
    visualizations.push({
      type: 'lineChart',
      title: 'Moving Average (3-month)',
      data: visualizationData.movingAverage,
      config: {
        labels: {
          categoryKey: 'date',
          valueKey: 'value'
        },
        xAxisLabel: 'Date',
        yAxisLabel: 'Average Count'
      }
    });
  }
  
  return {
    text: responseText,
    visualizations,
    data: {
      trendStats,
      significantChanges,
      timeSeriesAnalysis,
      timeRange
    }
  };
}

/**
 * Generate response for violation search queries
 * @param {Object} structuredQuery - The structured query
 * @param {Object} retrievedData - Retrieved data
 * @param {Object} analysisResults - Analysis results
 * @returns {Object} Formatted response
 */
function generateViolationSearchResponse(structuredQuery, retrievedData, analysisResults) {
  const { violationStats, topViolationTypes, buildingsWithMultipleViolations, visualizationData } = analysisResults;
  const { narrativeInsights } = analysisResults;
  const { data } = retrievedData;
  
  // Format the main response text
  let responseText = `# Violation Analysis\n\n`;
  
  // Add summary from narrative insights
  if (narrativeInsights && narrativeInsights.summary) {
    responseText += `## Summary\n\n${narrativeInsights.summary}\n\n`;
  } else {
    responseText += `## Summary\n\n`;
    responseText += `I analyzed ${violationStats.totalViolations} violations `;
    
    if (structuredQuery.entities.locations && structuredQuery.entities.locations.length > 0) {
      responseText += `in ${structuredQuery.entities.locations.join(', ')} `;
    }
    
    responseText += `.\n\n`;
    responseText += `There are **${violationStats.openViolations} open** and **${violationStats.closedViolations} closed** violations in the dataset. `;
    responseText += `The violations come from **${violationStats.hpdViolations} HPD** and **${violationStats.dobViolations} DOB** records.\n\n`;
  }
  
  // Add key findings section
  responseText += `## Key Findings\n\n`;
  
  if (narrativeInsights && narrativeInsights.keyFindings && narrativeInsights.keyFindings.length > 0) {
    narrativeInsights.keyFindings.forEach(finding => {
      responseText += `- ${finding}\n`;
    });
  } else {
    // Default key findings if AI didn't generate any
    if (topViolationTypes && topViolationTypes.length > 0) {
      responseText += `The most common violation types are:\n\n`;
      topViolationTypes.forEach(type => {
        responseText += `- **${type.type}**: ${type.count} violations\n`;
      });
    }
    
    if (buildingsWithMultipleViolations && buildingsWithMultipleViolations.length > 0) {
      responseText += `\nThe building with the most violations is at **${buildingsWithMultipleViolations[0].address}** with ${buildingsWithMultipleViolations[0].violationCount} violations.\n`;
    }
  }
  
  // Add recent violations table
  responseText += `\n## Recent Violations\n\n`;
  
  if (data && data.length > 0) {
    responseText += `| Date | Address | Borough | Type | Status | Source |\n`;
    responseText += `| ---- | ------- | ------- | ---- | ------ | ------ |\n`;
    
    data.slice(0, 5).forEach(violation => {
      const date = new Date(violation.issueddate).toLocaleDateString();
      responseText += `| ${date} | ${violation.address} | ${violation.borough} | ${violation.violationtype || 'N/A'} | ${violation.violationstatus} | ${violation.source} |\n`;
    });
    
    responseText += `\n*Showing ${Math.min(5, data.length)} of ${data.length} violations*\n\n`;
  } else {
    responseText += `No violations were found matching your criteria.\n\n`;
  }
  
  // Add explanations if available
  if (narrativeInsights && narrativeInsights.explanations && narrativeInsights.explanations.length > 0) {
    responseText += `## Explanations\n\n`;
    narrativeInsights.explanations.forEach(explanation => {
      responseText += `- ${explanation}\n`;
    });
    responseText += `\n`;
  }
  
  // Prepare visualization configurations
  const visualizations = [];
  
  if (visualizationData && visualizationData.violationsByType) {
    visualizations.push({
      type: 'barChart',
      title: 'Top Violation Types',
      data: visualizationData.violationsByType,
      config: {
        labels: {
          categoryKey: 'category',
          valueKey: 'value'
        },
        xAxisLabel: 'Violation Type',
        yAxisLabel: 'Count'
      }
    });
  }
  
  if (visualizationData && visualizationData.violationsBySource) {
    visualizations.push({
      type: 'pieChart',
      title: 'Violations by Source',
   <response clipped><NOTE>To save on context only part of this file has been shown to you. You should retry this tool after you have searched inside the file with `grep -n` in order to find the line numbers of what you are looking for.</NOTE>