/**
 * Database Query Builder for NYCDB AI Integration
 * 
 * This module provides utilities for building and executing database queries
 * based on the structured queries from the NLP service.
 */

const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Initialize PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'nycdb',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

/**
 * Execute a SQL query with parameters
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<Object>} Query result
 */
async function executeQuery(text, params = []) {
  try {
    const start = Date.now();
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    console.log('Executed query', { text, duration, rows: result.rowCount });
    
    return result;
  } catch (error) {
    console.error('Error executing query', { text, error });
    throw error;
  }
}

/**
 * Build a SQL query for risk assessment
 * @param {Object} queryParams - Query parameters
 * @returns {Object} SQL query and parameters
 */
function buildRiskAssessmentQuery(queryParams) {
  const { filters, limit } = queryParams;
  
  // Start building the WHERE clause
  let whereClause = [];
  let params = [];
  let paramIndex = 1;
  
  // Process filters
  filters.forEach(filter => {
    const { table, column, operator, value } = filter;
    
    if (operator === 'BETWEEN' && Array.isArray(value) && value.length === 2) {
      whereClause.push(`${table}.${column} BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
      params.push(value[0], value[1]);
      paramIndex += 2;
    } else {
      whereClause.push(`${table}.${column} ${operator} $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  });
  
  // Default WHERE clause if none provided
  if (whereClause.length === 0) {
    whereClause.push('1=1');
  }
  
  // Build the complete query
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
      ${whereClause.join(' AND ')}
    GROUP BY 
      p.bbl, p.address, p.borough, p.block, p.lot, p.bldgclass, p.yearbuilt
    ORDER BY 
      total_violations DESC
    LIMIT $${paramIndex}
  `;
  
  params.push(limit || 100);
  
  return { query, params };
}

/**
 * Build a SQL query for trend analysis
 * @param {Object} queryParams - Query parameters
 * @returns {Object} SQL query and parameters
 */
function buildTrendAnalysisQuery(queryParams) {
  const { filters, table, timeColumn } = queryParams;
  
  // Default values
  const actualTable = table || 'dob_permits';
  const actualTimeColumn = timeColumn || 'issueddate';
  
  // Start building the WHERE clause
  let whereClause = [];
  let params = [];
  let paramIndex = 1;
  
  // Process filters
  filters.forEach(filter => {
    const { column, operator, value } = filter;
    
    if (operator === 'BETWEEN' && Array.isArray(value) && value.length === 2) {
      whereClause.push(`${column} BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
      params.push(value[0], value[1]);
      paramIndex += 2;
    } else {
      whereClause.push(`${column} ${operator} $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  });
  
  // Default WHERE clause if none provided
  if (whereClause.length === 0) {
    whereClause.push('1=1');
  }
  
  // Build the complete query
  const query = `
    SELECT 
      DATE_TRUNC('month', ${actualTimeColumn}) as time_period,
      COUNT(*) as count
    FROM 
      ${actualTable}
    WHERE 
      ${whereClause.join(' AND ')}
    GROUP BY 
      DATE_TRUNC('month', ${actualTimeColumn})
    ORDER BY 
      time_period ASC
  `;
  
  return { query, params };
}

/**
 * Build a SQL query for violation search
 * @param {Object} queryParams - Query parameters
 * @returns {Object} SQL query and parameters
 */
function buildViolationSearchQuery(queryParams) {
  const { filters, tables, limit } = queryParams;
  
  // Start building the WHERE clause
  let whereClause = [];
  let params = [];
  let paramIndex = 1;
  
  // Process filters
  filters.forEach(filter => {
    const { column, operator, value } = filter;
    
    if (operator === 'BETWEEN' && Array.isArray(value) && value.length === 2) {
      whereClause.push(`${column} BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
      params.push(value[0], value[1]);
      paramIndex += 2;
    } else {
      whereClause.push(`${column} ${operator} $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  });
  
  // Default WHERE clause if none provided
  if (whereClause.length === 0) {
    whereClause.push('1=1');
  }
  
  let query;
  
  // Determine which tables to query
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
        ${whereClause.join(' AND ')}
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
        ${whereClause.join(' AND ')}
      ORDER BY 
        issueddate DESC
      LIMIT $${paramIndex}
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
        ${whereClause.join(' AND ')}
      ORDER BY 
        issueddate DESC
      LIMIT $${paramIndex}
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
        ${whereClause.join(' AND ')}
      ORDER BY 
        issueddate DESC
      LIMIT $${paramIndex}
    `;
  }
  
  params.push(limit || 100);
  
  return { query, params };
}

/**
 * Build a SQL query for building lookup
 * @param {Object} queryParams - Query parameters
 * @returns {Object} SQL query and parameters
 */
function buildBuildingLookupQuery(queryParams) {
  const { filters, orderBy, limit } = queryParams;
  
  // Start building the WHERE clause
  let whereClause = [];
  let params = [];
  let paramIndex = 1;
  
  // Process filters
  filters.forEach(filter => {
    const { column, operator, value } = filter;
    
    if (operator === 'BETWEEN' && Array.isArray(value) && value.length === 2) {
      whereClause.push(`${column} BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
      params.push(value[0], value[1]);
      paramIndex += 2;
    } else {
      whereClause.push(`${column} ${operator} $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  });
  
  // Default WHERE clause if none provided
  if (whereClause.length === 0) {
    whereClause.push('1=1');
  }
  
  // Build the complete query
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
      ${whereClause.join(' AND ')}
    ORDER BY 
      ${orderBy || 'p.address ASC'}
    LIMIT $${paramIndex}
  `;
  
  params.push(limit || 100);
  
  return { query, params };
}

/**
 * Build a SQL query for comparison analysis
 * @param {Object} queryParams - Query parameters
 * @returns {Object} SQL query and parameters
 */
function buildComparisonQuery(queryParams) {
  const { filters, groupBy } = queryParams;
  
  // Start building the WHERE clause
  let whereClause = [];
  let params = [];
  let paramIndex = 1;
  
  // Process filters
  filters.forEach(filter => {
    const { column, operator, value } = filter;
    
    if (operator === 'BETWEEN' && Array.isArray(value) && value.length === 2) {
      whereClause.push(`${column} BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
      params.push(value[0], value[1]);
      paramIndex += 2;
    } else {
      whereClause.push(`${column} ${operator} $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  });
  
  // Default WHERE clause if none provided
  if (whereClause.length === 0) {
    whereClause.push('1=1');
  }
  
  // Default group by if none provided
  const groupByColumns = groupBy.length > 0 ? groupBy : ['p.borough'];
  
  // Build the complete query
  const query = `
    SELECT 
      ${groupByColumns.map(col => col).join(', ')},
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
      ${whereClause.join(' AND ')}
    GROUP BY 
      ${groupByColumns.join(', ')}
    ORDER BY 
      building_count DESC
  `;
  
  return { query, params };
}

/**
 * Build a SQL query for general statistics
 * @param {Object} queryParams - Query parameters
 * @returns {Object} SQL query and parameters
 */
function buildGeneralStatsQuery(queryParams) {
  const { filters } = queryParams;
  
  // Start building the WHERE clause
  let whereClause = [];
  let params = [];
  let paramIndex = 1;
  
  // Process filters
  filters.forEach(filter => {
    const { column, operator, value } = filter;
    
    if (operator === 'BETWEEN' && Array.isArray(value) && value.length === 2) {
      whereClause.push(`${column} BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
      params.push(value[0], value[1]);
      paramIndex += 2;
    } else {
      whereClause.push(`${column} ${operator} $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  });
  
  // Default WHERE clause if none provided
  if (whereClause.length === 0) {
    whereClause.push('1=1');
  }
  
  // Build the complete query
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
      ${whereClause.join(' AND ')}
  `;
  
  return { query, params };
}

/**
 * Build a SQL query based on query type and parameters
 * @param {string} queryType - Type of query
 * @param {Object} queryParams - Query parameters
 * @returns {Object} SQL query and parameters
 */
function buildQuery(queryType, queryParams) {
  switch (queryType) {
    case 'risk_assessment':
      return buildRiskAssessmentQuery(queryParams);
    case 'trend_analysis':
      return buildTrendAnalysisQuery(queryParams);
    case 'violation_search':
      return buildViolationSearchQuery(queryParams);
    case 'building_lookup':
      return buildBuildingLookupQuery(queryParams);
    case 'comparison':
      return buildComparisonQuery(queryParams);
    case 'general_stats':
      return buildGeneralStatsQuery(queryParams);
    default:
      // Default to a simple building lookup
      return buildBuildingLookupQuery(queryParams);
  }
}

module.exports = {
  executeQuery,
  buildQuery,
  pool
};
