import { Request, Response } from 'express';
import pool from '../config/database';

// Save user preferences
export const savePreferences = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { preferences } = req.body;
    
    const query = `
      INSERT INTO user_preferences (user_id, preferences)
      VALUES ($1, $2)
      ON CONFLICT (user_id) 
      DO UPDATE SET preferences = $2, updated_at = NOW()
      RETURNING id, user_id, preferences, created_at, updated_at;
    `;
    
    const result = await pool.query(query, [userId, preferences]);
    
    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error saving preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to save preferences'
    });
  }
};

// Get user preferences
export const getPreferences = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    const query = `
      SELECT id, user_id, preferences, created_at, updated_at
      FROM user_preferences
      WHERE user_id = $1;
    `;
    
    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        data: { preferences: {} }
      });
    }
    
    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error getting preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to get preferences'
    });
  }
};

// Save a query
export const saveQuery = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { name, dataset, query, description } = req.body;
    
    const queryText = `
      INSERT INTO saved_queries (user_id, name, dataset, query, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, user_id, name, dataset, query, description, created_at;
    `;
    
    const result = await pool.query(queryText, [userId, name, dataset, query, description]);
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error saving query:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to save query'
    });
  }
};

// Get saved queries
export const getSavedQueries = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    const query = `
      SELECT id, user_id, name, dataset, query, description, created_at
      FROM saved_queries
      WHERE user_id = $1
      ORDER BY created_at DESC;
    `;
    
    const result = await pool.query(query, [userId]);
    
    res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error getting saved queries:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to get saved queries'
    });
  }
};

// Delete a saved query
export const deleteQuery = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    
    const query = `
      DELETE FROM saved_queries
      WHERE id = $1 AND user_id = $2
      RETURNING id;
    `;
    
    const result = await pool.query(query, [id, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Query not found or not authorized to delete'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting query:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to delete query'
    });
  }
};
