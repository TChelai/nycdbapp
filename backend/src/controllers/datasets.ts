import { Request, Response } from 'express';
import postgrestClient from '../config/postgrest';
import pool from '../config/database';

// Get all available datasets
export const getAllDatasets = async (req: Request, res: Response) => {
  try {
    // Query to get all tables in the database
    const query = `
      SELECT 
        table_name,
        obj_description(
          (table_schema || '.' || table_name)::regclass, 
          'pg_class'
        ) as description
      FROM 
        information_schema.tables
      WHERE 
        table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY 
        table_name;
    `;
    
    const result = await pool.query(query);
    
    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching datasets:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to fetch datasets'
    });
  }
};

// Get metadata for a specific dataset
export const getDatasetMetadata = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Query to get column information for the specified table
    const query = `
      SELECT 
        column_name,
        data_type,
        col_description(
          (table_schema || '.' || table_name)::regclass,
          ordinal_position
        ) as description
      FROM 
        information_schema.columns
      WHERE 
        table_schema = 'public'
        AND table_name = $1
      ORDER BY 
        ordinal_position;
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Dataset '${id}' not found`
      });
    }
    
    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error(`Error fetching metadata for dataset ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to fetch dataset metadata'
    });
  }
};

// Query data from a specific dataset
export const queryDataset = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = 100, offset = 0, order, filter } = req.query;
    
    // Construct the PostgREST request URL with query parameters
    const url = `/${id}`;
    const params = {
      limit: limit.toString(),
      offset: offset.toString(),
      ...(order && { order: order.toString() }),
      ...(filter && { filter: filter.toString() })
    };
    
    // Make request to PostgREST
    const response = await postgrestClient.get(url, { params });
    
    // Get total count using a separate request with Range header
    const countResponse = await postgrestClient.get(url, {
      headers: {
        'Range-Unit': 'items',
        'Range': '0-0'
      }
    });
    
    // Extract total count from Content-Range header
    const contentRange = countResponse.headers['content-range'];
    const totalCount = contentRange ? parseInt(contentRange.split('/')[1]) : 0;
    
    res.status(200).json({
      success: true,
      count: response.data.length,
      total: totalCount,
      data: response.data
    });
  } catch (error) {
    console.error(`Error querying dataset ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to query dataset'
    });
  }
};

// Get aggregated data for visualizations
export const getAggregatedData = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { groupBy, aggregateFunc, valueField } = req.query;
    
    if (!groupBy || !aggregateFunc || !valueField) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Missing required parameters: groupBy, aggregateFunc, valueField'
      });
    }
    
    // Construct SQL query for aggregation
    const query = `
      SELECT 
        ${groupBy} as category,
        ${aggregateFunc}(${valueField}) as value
      FROM 
        ${id}
      GROUP BY 
        ${groupBy}
      ORDER BY 
        value DESC
      LIMIT 20;
    `;
    
    const result = await pool.query(query);
    
    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error(`Error getting aggregated data for dataset ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to get aggregated data'
    });
  }
};
