/**
 * Visualization Generator Service for NYCDB AI Integration
 * 
 * This service generates visualization configurations based on analysis results
 * to help users understand the data through charts and graphs.
 */

/**
 * Generate visualization configurations based on analysis results
 * @param {Object} structuredQuery - The structured query from NLP service
 * @param {Object} analysisResults - Results from data analysis
 * @returns {Array} Visualization configurations
 */
function generateVisualizations(structuredQuery, analysisResults) {
  // Select visualization generator based on query type
  let visualizations = [];
  
  switch (structuredQuery.queryType) {
    case 'risk_assessment':
      visualizations = generateRiskAssessmentVisualizations(analysisResults);
      break;
    case 'trend_analysis':
      visualizations = generateTrendAnalysisVisualizations(analysisResults);
      break;
    case 'violation_search':
      visualizations = generateViolationSearchVisualizations(analysisResults);
      break;
    case 'building_lookup':
      visualizations = generateBuildingLookupVisualizations(analysisResults);
      break;
    case 'comparison':
      visualizations = generateComparisonVisualizations(analysisResults);
      break;
    case 'general_stats':
      visualizations = generateGeneralStatsVisualizations(analysisResults);
      break;
    default:
      visualizations = generateGenericVisualizations(analysisResults);
  }
  
  return visualizations;
}

/**
 * Generate visualizations for risk assessment results
 * @param {Object} analysisResults - Risk assessment analysis results
 * @returns {Array} Visualization configurations
 */
function generateRiskAssessmentVisualizations(analysisResults) {
  const visualizations = [];
  
  // Extract relevant data
  const { riskStats, highRiskPatterns, visualizationData, topRiskBuildings } = analysisResults;
  
  // Risk level distribution pie chart
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
  
  // Risk by borough bar chart
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
  
  // Risk by building age bar chart
  if (visualizationData && visualizationData.riskByBuildingAge) {
    visualizations.push({
      type: 'barChart',
      title: 'Risk Level by Building Age',
      data: visualizationData.riskByBuildingAge.map(item => ({
        category: item.ageRange,
        value: item.highRiskCount
      })),
      config: {
        labels: {
          categoryKey: 'category',
          valueKey: 'value'
        },
        xAxisLabel: 'Building Age',
        yAxisLabel: 'Number of High Risk Buildings'
      }
    });
  }
  
  // Top risk buildings table
  if (topRiskBuildings && topRiskBuildings.length > 0) {
    visualizations.push({
      type: 'table',
      title: 'Top High Risk Buildings',
      data: topRiskBuildings.slice(0, 10).map(building => ({
        address: building.address,
        borough: building.borough,
        yearBuilt: building.yearbuilt,
        riskScore: building.risk_score.toFixed(1),
        riskLevel: building.risk_level
      })),
      config: {
        columns: [
          { key: 'address', label: 'Address' },
          { key: 'borough', label: 'Borough' },
          { key: 'yearBuilt', label: 'Year Built' },
          { key: 'riskScore', label: 'Risk Score' },
          { key: 'riskLevel', label: 'Risk Level' }
        ]
      }
    });
  }
  
  return visualizations;
}

/**
 * Generate visualizations for trend analysis results
 * @param {Object} analysisResults - Trend analysis results
 * @returns {Array} Visualization configurations
 */
function generateTrendAnalysisVisualizations(analysisResults) {
  const visualizations = [];
  
  // Extract relevant data
  const { trendStats, significantChanges, timeSeriesAnalysis, visualizationData } = analysisResults;
  
  // Trend line chart
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
  
  // Moving average line chart
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
  
  // Year-over-year comparison bar chart
  if (visualizationData && visualizationData.yearOverYearComparison) {
    visualizations.push({
      type: 'barChart',
      title: 'Year-over-Year Comparison',
      data: visualizationData.yearOverYearComparison.map(item => ({
        category: item.date,
        currentYear: item.currentValue,
        previousYear: item.previousValue
      })),
      config: {
        labels: {
          categoryKey: 'category',
          valueKeys: ['currentYear', 'previousYear']
        },
        xAxisLabel: 'Month',
        yAxisLabel: 'Count',
        isGrouped: true
      }
    });
  }
  
  // Significant changes table
  if (significantChanges && significantChanges.length > 0) {
    visualizations.push({
      type: 'table',
      title: 'Significant Changes',
      data: significantChanges.map(change => ({
        period: new Date(change.period).toLocaleDateString(),
        previousPeriod: new Date(change.previousPeriod).toLocaleDateString(),
        previousValue: change.previousValue,
        currentValue: change.currentValue,
        percentChange: `${change.percentChange}%`,
        direction: change.direction
      })),
      config: {
        columns: [
          { key: 'period', label: 'Period' },
          { key: 'previousValue', label: 'Previous Value' },
          { key: 'currentValue', label: 'Current Value' },
          { key: 'percentChange', label: 'Change' },
          { key: 'direction', label: 'Direction' }
        ]
      }
    });
  }
  
  return visualizations;
}

/**
 * Generate visualizations for violation search results
 * @param {Object} analysisResults - Violation search results
 * @returns {Array} Visualization configurations
 */
function generateViolationSearchVisualizations(analysisResults) {
  const visualizations = [];
  
  // Extract relevant data
  const { violationStats, topViolationTypes, buildingsWithMultipleViolations, visualizationData } = analysisResults;
  
  // Violations by type bar chart
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
        yAxisLabel: 'Count',
        isHorizontal: true
      }
    });
  }
  
  // Violations by source pie chart
  if (visualizationData && visualizationData.violationsBySource) {
    visualizations.push({
      type: 'pieChart',
      title: 'Violations by Source',
      data: visualizationData.violationsBySource,
      config: {
        labels: {
          categoryKey: 'category',
          valueKey: 'value'
        }
      }
    });
  }
  
  // Violations by status pie chart
  if (visualizationData && visualizationData.violationsByStatus) {
    visualizations.push({
      type: 'pieChart',
      title: 'Violations by Status',
      data: visualizationData.violationsByStatus,
      config: {
        labels: {
          categoryKey: 'category',
          valueKey: 'value'
        }
      }
    });
  }
  
  // Buildings with multiple violations table
  if (buildingsWithMultipleViolations && buildingsWithMultipleViolations.length > 0) {
    visualizations.push({
      type: 'table',
      title: 'Buildings with Multiple Violations',
      data: buildingsWithMultipleViolations.map(building => ({
        address: building.address,
        borough: building.borough,
        violationCount: building.violationCount,
        bbl: building.bbl
      })),
      config: {
        columns: [
          { key: 'address', label: 'Address' },
          { key: 'borough', label: 'Borough' },
          { key: 'violationCount', label: 'Violation Count' }
        ]
      }
    });
  }
  
  return visualizations;
}

/**
 * Generate visualizations for building lookup results
 * @param {Object} analysisResults - Building lookup results
 * @returns {Array} Visualization configurations
 */
function generateBuildingLookupVisualizations(analysisResults) {
  const visualizations = [];
  
  // Extract relevant data
  const { buildingStats, visualizationData, buildings } = analysisResults;
  
  // Buildings by type pie chart
  if (visualizationData && visualizationData.buildingsByType) {
    visualizations.push({
      type: 'pieChart',
      title: 'Buildings by Type',
      data: visualizationData.buildingsByType,
      config: {
        labels: {
          categoryKey: 'category',
          valueKey: 'value'
        }
      }
    });
  }
  
  // Buildings by age bar chart
  if (visualizationData && visualizationData.buildingsByAge) {
    visualizations.push({
      type: 'barChart',
      title: 'Buildings by Age',
      data: visualizationData.buildingsByAge,
      config: {
        labels: {
          categoryKey: 'category',
          valueKey: 'value'
        },
        xAxisLabel: 'Age Range',
        yAxisLabel: 'Count'
      }
    });
  }
  
  // Buildings by size bar chart
  if (visualizationData && visualizationData.buildingsBySize) {
    visualizations.push({
      type: 'barChart',
      title: 'Buildings by Size',
      data: visualizationData.buildingsBySize,
      config: {
        labels: {
          categoryKey: 'category',
          valueKey: 'value'
        },
        xAxisLabel: 'Size (Floors)',
        yAxisLabel: 'Count'
      }
    });
  }
  
  // Buildings table
  if (buildings && buildings.length > 0) {
    visualizations.push({
      type: 'table',
      title: 'Building Details',
      data: buildings.map(building => ({
        address: building.address,
        borough: building.borough,
        yearBuilt: building.yearbuilt,
        floors: building.numfloors,
        units: building.unitsres,
        buildingClass: building.bldgclass
      })),
      config: {
        columns: [
          { key: 'address', label: 'Address' },
          { key: 'borough', label: 'Borough' },
          { key: 'yearBuilt', label: 'Year Built' },
          { key: 'floors', label: 'Floors' },
          { key: 'units', label: 'Units' },
          { key: 'buildingClass', label: 'Building Class' }
        ]
      }
    });
  }
  
  return visualizations;
}

/**
 * Generate visualizations for comparison results
 * @param {Object} analysisResults - Comparison results
 * @returns {Array} Visualization configurations
 */
function generateComparisonVisualizations(analysisResults) {
  const visualizations = [];
  
  // Extract relevant data
  const { comparisonStats, significantDifferences, visualizationData, comparisonData } = analysisResults;
  
  // Generate a visualization for each metric
  if (visualizationData) {
    Object.entries(visualizationData).forEach(([metric, data]) => {
      let title;
      switch (metric) {
        case 'building_count':
          title = 'Building Count by Category';
          break;
        case 'avg_year_built':
          title = 'Average Year Built by Category';
          break;
        case 'avg_floors':
          title = 'Average Floors by Category';
          break;
        case 'avg_residential_units':
          title = 'Average Residential Units by Category';
          break;
        case 'hpd_violation_count':
          title = 'HPD Violations by Category';
          break;
        case 'dob_violation_count':
          title = 'DOB Violations by Category';
          break;
        default:
          title = `${metric.replace(/_/g, ' ')} by Category`;
      }
      
      visualizations.push({
        type: 'barChart',
        title,
        data,
        config: {
          labels: {
            categoryKey: 'category',
            valueKey: 'value'
          },
          xAxisLabel: 'Category',
          yAxisLabel: metric.replace(/_/g, ' ')
        }
      });
    });
  }
  
  // Comparison table
  if (comparisonData && comparisonData.length > 0) {
    const firstKey = Object.keys(comparisonData[0])[0];
    
    const columns = Object.keys(comparisonData[0]).map(key => {
      return {
        key,
        label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      };
    });
    
    visualizations.push({
      type: 'table',
      title: 'Comparison Data',
      data: comparisonData,
      config: { columns }
    });
  }
  
  return visualizations;
}

/**
 * Generate visualizations for general statistics results
 * @param {Object} analysisResults - General statistics results
 * @returns {Array} Visualization configurations
 */
function generateGeneralStatsVisualizations(analysisResults) {
  const visualizations = [];
  
  // Extract relevant data
  const { generalStats, derivedStats, visualizationData } = analysisResults;
  
  // Violation distribution pie chart
  if (visualizationData && visualizationData.violationDistribution) {
    visualizations.push({
      type: 'pieChart',
      title: 'Violation Distribution',
      data: visualizationData.violationDistribution,
      config: {
        labels: {
          categoryKey: 'category',
          valueKey: 'value'
        }
      }
    });
  }
  
  // Building age distribution bar chart
  if (visualizationData && visualizationData.buildingAgeDistribution) {
    visualizations.push({
      type: 'barChart',
      title: 'Building Age Distribution',
      data: visualizationData.buildingAgeDistribution,
      config: {
        labels: {
          categoryKey: 'category',
          valueKey: 'value'
        },
        xAxisLabel: 'Age Range',
        yAxisLabel: 'Count'
      }
    });
  }
  
  // General stats table
  if (generalStats) {
    const tableData = [];
    
    // Convert general stats object to array of key-value pairs
    Object.entries(generalStats).forEach(([key, value]) => {
      tableData.push({
        metric: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: typeof value === 'number' ? 
          (value > 1000 ? value.toLocaleString() : value.toFixed(2)) : 
          value
      });
    });
    
    // Add derived stats
    if (derivedStats) {
      Object.entries(derivedStats).forEach(([key, value]) => {
        tableData.push({
          metric: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value: typeof value === 'number' ? 
            (value > 1000 ? value.toLocaleString() : value.toFixed(2)) : 
            value
        });
      });
    }
    
    visualizations.push({
      type: 'table',
      title: 'General Statistics',
      data: tableData,
      config: {
        columns: [
          { key: 'metri<response clipped><NOTE>To save on context only part of this file has been shown to you. You should retry this tool after you have searched inside the file with `grep -n` in order to find the line numbers of what you are looking for.</NOTE>