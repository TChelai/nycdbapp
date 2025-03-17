/**
 * Data Retrieval Service for NYCDB AI Integration
 * 
 * This service handles the transformation of structured queries from the NLP service
 * into database operations, retrieving data from the NYCDB database.
 */

const pool = require('./config/database');
const postgrestClient = require('./config/postgrest');
const { QUERY_TYPES, ENTITY_TYPES } = require('./nlp-service');

/**
 * Retrieve data based on the structured query from NLP service
 * @param {Object} structuredQuery - The structured query from NLP service
 * @returns {Object} Retrieved data and metadata
 */
async function retrieveData(structuredQuery) {
  try {
    // Convert structured query to database query parameters
    const dbQuery = buildDatabaseQuery(structuredQuery);
    
    // Execute the query based on query type
    let result;
    switch (structuredQuery.queryType) {
      case QUERY_TYPES.RISK_ASSESSMENT:
        result = await retrieveRiskAssessmentData(dbQuery);
        break;
      case QUERY_TYPES.TREND_ANALYSIS:
        result = await retrieveTrendAnalysisData(dbQuery);
        break;
      case QUERY_TYPES.VIOLATION_SEARCH:
        result = await retrieveViolationData(dbQuery);
        break;
      case QUERY_TYPES.BUILDING_LOOKUP:
        result = await retrieveBuildingData(dbQuery);
        break;
      case QUERY_TYPES.COMPARISON:
        result = await retrieveComparisonData(dbQuery);
        break;
      case QUERY_TYPES.GENERAL_STATS:
        result = await retrieveGeneralStatsData(dbQuery);
        break;
      default:
        // Default to a general query if type is not recognized
        result = await retrieveGeneralData(dbQuery);
    }
    
    // Add metadata about the query and results
    result.metadata = {
      queryType: structuredQuery.queryType,
      entities: structuredQuery.entities,
      timestamp: new Date().toISOString(),
      rowCount: result.data ? result.data.length : 0
    };
    
    return result;
  } catch (error) {
    console.error('Error retrieving data:', error);
    throw new Error('Failed to retrieve data from database');
  }
}

/**
 * Build database query parameters from structured query
 * @param {Object} structuredQuery - The structured query from NLP service
 * @returns {Object} Database query parameters
 */
function buildDatabaseQuery(structuredQuery) {
  const dbQuery = {
    tables: [],
    columns: [],
    filters: [],
    joins: [],
    groupBy: [],
    orderBy: null,
    limit: structuredQuery.limit || 100
  };
  
  // Determine which tables to query based on query type
  switch (structuredQuery.queryType) {
    case QUERY_TYPES.RISK_ASSESSMENT:
      dbQuery.tables.push('hpd_violations', 'dob_violations', 'pluto');
      break;
    case QUERY_TYPES.TREND_ANALYSIS:
      dbQuery.tables.push('dob_permits');
      break;
    case QUERY_TYPES.VIOLATION_SEARCH:
      dbQuery.tables.push('hpd_violations', 'dob_violations');
      break;
    case QUERY_TYPES.BUILDING_LOOKUP:
      dbQuery.tables.push('pluto');
      break;
    case QUERY_TYPES.COMPARISON:
      dbQuery.tables.push('pluto', 'hpd_violations', 'dob_violations');
      break;
    case QUERY_TYPES.GENERAL_STATS:
      dbQuery.tables.push('pluto');
      break;
    default:
      dbQuery.tables.push('pluto');
  }
  
  // Add location filters if present
  if (structuredQuery.entities.locations) {
    structuredQuery.entities.locations.forEach(location => {
      dbQuery.filters.push({
        table: 'pluto',
        column: 'borough',
        operator: '=',
        value: location
      });
    });
  }
  
  // Add building type filters if present
  if (structuredQuery.entities.buildingTypes) {
    structuredQuery.entities.buildingTypes.forEach(buildingType => {
      // Map common building type terms to database values
      let dbValue;
      switch (buildingType.toLowerCase()) {
        case 'residential':
          dbValue = 'R';
          break;
        case 'commercial':
          dbValue = 'C';
          break;
        case 'mixed use':
          dbValue = 'M';
          break;
        default:
          dbValue = buildingType;
      }
      
      dbQuery.filters.push({
        table: 'pluto',
        column: 'bldgclass',
        operator: 'LIKE',
        value: `${dbValue}%`
      });
    });
  }
  
  // Add time period filters if present
  if (structuredQuery.entities.timePeriods) {
    structuredQuery.entities.timePeriods.forEach(period => {
      if (typeof period === 'object' && period.start && period.end) {
        // For violation queries
        if (dbQuery.tables.includes('hpd_violations') || dbQuery.tables.includes('dob_violations')) {
          dbQuery.filters.push({
            table: dbQuery.tables.includes('hpd_violations') ? 'hpd_violations' : 'dob_violations',
            column: 'issueddate',
            operator: 'BETWEEN',
            value: [period.start, period.end]
          });
        }
        
        // For permit queries
        if (dbQuery.tables.includes('dob_permits')) {
          dbQuery.filters.push({
            table: 'dob_permits',
            column: 'issueddate',
            operator: 'BETWEEN',
            value: [period.start, period.end]
          });
        }
      }
    });
  }
  
  // Add explicit filters from the structured query
  if (structuredQuery.filters && structuredQuery.filters.length > 0) {
    structuredQuery.filters.forEach(filter => {
      dbQuery.filters.push(filter);
    });
  }
  
  // Add aggregations if present
  if (structuredQuery.aggregations && structuredQuery.aggregations.length > 0) {
    structuredQuery.aggregations.forEach(agg => {
      if (agg.groupBy) {
        dbQuery.groupBy.push(agg.groupBy);
      }
    });
  }
  
  // Add sort order if present
  if (structuredQuery.sortOrder) {
    dbQuery.orderBy = structuredQuery.sortOrder;
  }
  
  return dbQuery;
}

/**
 * Retrieve risk assessment data for buildings
 * @param {Object} dbQuery - Database query parameters
 * @returns {Object} Risk assessment data
 */
async function retrieveRiskAssessmentData(dbQuery) {
  // Query to get buildings with high violation counts
  const query = `
    SELECT 
      p.bbl,
      p.address,
      p.borough,
      p.block,
      p.lot,
      p.bldgclass,
      p.yearbuilt,
      COUNT(DISTINCT hv.id) as hpd_violation_count,
      COUNT(DISTINCT dv.id) as dob_violation_count,
      (COUNT(DISTINCT hv.id) + COUNT(DISTINCT dv.id)) as total_violations
    FROM 
      pluto p
    LEFT JOIN 
      hpd_violations hv ON p.bbl = hv.bbl
    LEFT JOIN 
      dob_violations dv ON p.bbl = dv.bbl
    WHERE 
      ${buildWhereClause(dbQuery.filters)}
    GROUP BY 
      p.bbl, p.address, p.borough, p.block, p.lot, p.bldgclass, p.yearbuilt
    ORDER BY 
      total_violations DESC
    LIMIT ${dbQuery.limit};
  `;
  
  const result = await pool.query(query);
  
  // Calculate risk scores based on violation counts and building age
  const data = result.rows.map(building => {
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
    analysisType: 'risk_assessment'
  };
}

/**
 * Retrieve trend analysis data
 * @param {Object} dbQuery - Database query parameters
 * @returns {Object} Trend analysis data
 */
async function retrieveTrendAnalysisData(dbQuery) {
  // Determine if we're analyzing permits, violations, or something else
  let timeColumn, countColumn;
  let table = dbQuery.tables[0];
  
  if (table === 'dob_permits') {
    timeColumn = 'issueddate';
    countColumn = 'COUNT(*)';
  } else if (table === 'hpd_violations' || table === 'dob_violations') {
    timeColumn = 'issueddate';
    countColumn = 'COUNT(*)';
  } else {
    // Default to a general time-based query
    timeColumn = 'created_at';
    countColumn = 'COUNT(*)';
  }
  
  // Extract time period from filters
  let startDate = '2018-01-01'; // Default to 5 years ago
  let endDate = new Date().toISOString().split('T')[0]; // Today
  
  dbQuery.filters.forEach(filter => {
    if (filter.column === timeColumn && filter.operator === 'BETWEEN') {
      startDate = filter.value[0];
      endDate = filter.value[1];
    }
  });
  
  // Query to get time-series data
  const query = `
    SELECT 
      DATE_TRUNC('month', ${timeColumn}) as time_period,
      ${countColumn} as count
    FROM 
      ${table}
    WHERE 
      ${buildWhereClause(dbQuery.filters)}
    GROUP BY 
      DATE_TRUNC('month', ${timeColumn})
    ORDER BY 
      time_period ASC;
  `;
  
  const result = await pool.query(query);
  
  return {
    data: result.rows,
    analysisType: 'trend_analysis',
    timeRange: {
      start: startDate,
      end: endDate
    }
  };
}

/**
 * Retrieve violation data
 * @param {Object} dbQuery - Database query parameters
 * @returns {Object} Violation data
 */
async function retrieveViolationData(dbQuery) {
  // Determine which violation tables to query
  const tables = dbQuery.tables;
  let query;
  
  if (tables.includes('hpd_violations') && tables.includes('dob_violations')) {
    // Query both violation types
    query = `
      SELECT 
        'HPD' as source,
        v.violationid,
        v.bbl,
        p.address,
        p.borough,
        v.issueddate,
        v.violationstatus,
        v.violationtype,
        v.novdescription as description
      FROM 
        hpd_violations v
      JOIN 
        pluto p ON v.bbl = p.bbl
      WHERE 
        ${buildWhereClause(dbQuery.filters.filter(f => f.table !== 'dob_violations'))}
      UNION ALL
      SELECT 
        'DOB' as source,
        v.violationid,
        v.bbl,
        p.address,
        p.borough,
        v.issueddate,
        v.violationstatus,
        v.violationtype,
        v.description
      FROM 
        dob_violations v
      JOIN 
        pluto p ON v.bbl = p.bbl
      WHERE 
        ${buildWhereClause(dbQuery.filters.filter(f => f.table !== 'hpd_violations'))}
      ORDER BY 
        issueddate DESC
      LIMIT ${dbQuery.limit};
    `;
  } else if (tables.includes('hpd_violations')) {
    // Query only HPD violations
    query = `
      SELECT 
        'HPD' as source,
        v.violationid,
        v.bbl,
        p.address,
        p.borough,
        v.issueddate,
        v.violationstatus,
        v.violationtype,
        v.novdescription as description
      FROM 
        hpd_violations v
      JOIN 
        pluto p ON v.bbl = p.bbl
      WHERE 
        ${buildWhereClause(dbQuery.filters)}
      ORDER BY 
        issueddate DESC
      LIMIT ${dbQuery.limit};
    `;
  } else {
    // Query only DOB violations
    query = `
      SELECT 
        'DOB' as source,
        v.violationid,
        v.bbl,
        p.address,
        p.borough,
        v.issueddate,
        v.violationstatus,
        v.violationtype,
        v.description
      FROM 
        dob_violations v
      JOIN 
        pluto p ON v.bbl = p.bbl
      WHERE 
        ${buildWhereClause(dbQuery.filters)}
      ORDER BY 
        issueddate DESC
      LIMIT ${dbQuery.limit};
    `;
  }
  
  const result = await pool.query(query);
  
  return {
    data: result.rows,
    analysisType: 'violation_search'
  };
}

/**
 * Retrieve building data
 * @param {Object} dbQuery - Database query parameters
 * @returns {Object} Building data
 */
async function retrieveBuildingData(dbQuery) {
  const query = `
    SELECT 
      p.bbl,
      p.address,
      p.borough,
      p.block,
      p.lot,
      p.bldgclass,
      p.landuse,
      p.yearbuilt,
      p.numfloors,
      p.unitsres,
      p.unitstotal,
      p.assesstot,
      p.exemptland,
      p.exempttot
    FROM 
      pluto p
    WHERE 
      ${buildWhereClause(dbQuery.filters)}
    ORDER BY 
      ${dbQuery.orderBy || 'p.address ASC'}
    LIMIT ${dbQuery.limit};
  `;
  
  const result = await pool.query(query);
  
  return {
    data: result.rows,
    analysisType: 'building_lookup'
  };
}

/**
 * Retrieve comparison data between different areas or building types
 * @param {Object} dbQuery - Database query parameters
 * @returns {Object} Comparison data
 */
async function retrieveComparisonData(dbQuery) {
  // Extract comparison entities from the query
  const comparisonEntities = dbQuery.groupBy.length > 0 ? dbQuery.groupBy : ['borough'];
  
  const query = `
    SELECT 
      ${comparisonEntities.map(e => `p.${e}`).join(', ')},
      COUNT(DISTINCT p.bbl) as building_count,
      AVG(p.yearbuilt) as avg_year_built,
      AVG(p.numfloors) as avg_floors,
      AVG(p.unitsres) as avg_residential_units,
      COUNT(DISTINCT hv.id) as hpd_violation_count,
      COUNT(DISTINCT dv.id) as dob_violation_count
    FROM 
      pluto p
    LEFT JOIN 
      hpd_violations hv ON p.bbl = hv.bbl
    LEFT JOIN 
      dob_violations dv ON p.bbl = dv.bbl
    WHERE 
      ${buildWhereClause(dbQuery.filters)}
    GROUP BY 
      ${comparisonEntities.map(e => `p.${e}`).join(', ')}
    ORDER BY 
      building_count DESC;
  `;
  
  const result = await pool.query(query);
  
  return {
    data: result.rows,
    analysisType: 'comparison',
    comparisonBy: comparisonEntities
  };
}

/**
 * Retrieve general statistics about buildings
 * @param {Object} dbQuery - Database query parameters
 * @returns {Object} General statistics data
 */
async function retrieveGeneralStatsData(dbQuery) {
  const query = `
    SELECT 
      COUNT(DISTINCT p.bbl) as total_buildings,
      AVG(p.yearbuilt) as avg_year_built,
      MIN(p.yearbuilt) as oldest_building,
      MAX(p.yearbuilt) as newest_building,
      AVG(p.numfloors) as avg_floors,
      MAX(p.numfloors) as max_floors,
      SUM(p.unitsres) as total_residential_units,
      COUNT(DISTINCT hv.id) as total_hpd_violations,
      COUNT(DISTINCT dv.id) as total_dob_violations
    FROM 
      pluto p
    LEFT JOIN 
      hpd_violations hv ON p.bbl = hv.bbl
    LEFT JOIN 
      dob_violations dv ON p.bbl = dv.bbl
    WHERE 
      ${buildWhereClause(dbQuery.filters)};
  `;
  
  const result = await pool.query(query);
  
  return {
    data: result.rows[0],
    analysisType: 'general_stats'
  };
}

/**
 * Retrieve general data for any other query type
 * @param {Object} dbQuery - Database query parameters
 * @returns {Object} General data
 */
async function retrieveGeneralData(dbQuery) {
  // Use PostgREST for flexible querying
  const mainTable = dbQuery.tables[0];
  
  // Convert filters to PostgREST format
  const filters = dbQuery.filters
    .filter(f => f.table === mainTable)
    .map(f => {
      if (f.operator === '=') {
        return `${f.column}.eq.${f.value}`;
      } else if (f.operator === 'LIKE') {
        return `${f.column}.like.${f.value}`;
      } else if (f.operator === 'BETWEEN' && Array.isArray(f.value)) {
        return `and=(${f.column}.gte.${f.value[0]},${f.column}.lte.${f.value[1]})`;
      }
      return null;
    })
    .filter(Boolean)
    .join(',');
  
  // Make request to PostgREST
  const response = await postgrestClient.get(`/${mainTable}`, {
    params: {
      limit: dbQuery.limit,
      offset: 0,
      ...(filters && { filter: filters }),
      ...(dbQuery.orderBy && { order: dbQuery.orderBy })
    }
  });
  
  return {
    data: response.data,
    analysisType: 'general_query'
  };
}

/**
 * Build SQL WHERE clause from filter objects
 * @param {Array} filters - Array of filter objects
 * @returns {string} SQL WHERE clause
 */
function buildWhereClause(filters) {
  if (!filters || filters.length === 0) {
    return '1=1'; // Default to true if no filters
  }
  
  const clauses = filters.map(filter => {
    const { table, column, operator, value } = filter;
    
    // Handle different operator types
    switch (operator) {
      case '=':
        return `${table}.${column} = '${value}'`;
      case 'LIKE':
        <response clipped><NOTE>To save on context only part of this file has been shown to you. You should retry this tool after you have searched inside the file with `grep -n` in order to find the line numbers of what you are looking for.</NOTE>