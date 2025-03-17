import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/database';

// Register a new user
export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    
    // In a real application, you would hash the password before storing it
    // For this demo, we'll just store it as is
    
    const query = `
      INSERT INTO users (username, email, password)
      VALUES ($1, $2, $3)
      RETURNING id, username, email;
    `;
    
    const result = await pool.query(query, [username, email, password]);
    
    // Generate JWT token
    const token = jwt.sign(
      { id: result.rows[0].id, username: result.rows[0].username },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: process.env.JWT_EXPIRE || '1d' }
    );
    
    res.status(201).json({
      success: true,
      token,
      data: {
        id: result.rows[0].id,
        username: result.rows[0].username,
        email: result.rows[0].email
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to register user'
    });
  }
};

// Login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    const query = `
      SELECT id, username, email, password
      FROM users
      WHERE email = $1;
    `;
    
    const result = await pool.query(query, [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid credentials'
      });
    }
    
    const user = result.rows[0];
    
    // In a real application, you would compare hashed passwords
    // For this demo, we'll just compare them directly
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid credentials'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: process.env.JWT_EXPIRE || '1d' }
    );
    
    res.status(200).json({
      success: true,
      token,
      data: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to login'
    });
  }
};

// Get current user
export const getMe = async (req: Request, res: Response) => {
  try {
    // The user ID would be added to the request by the auth middleware
    const userId = (req as any).user.id;
    
    const query = `
      SELECT id, username, email
      FROM users
      WHERE id = $1;
    `;
    
    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: 'Failed to get user'
    });
  }
};
