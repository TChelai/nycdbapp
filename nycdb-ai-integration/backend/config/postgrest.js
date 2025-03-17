/**
 * PostgREST Client Configuration for NYCDB AI Integration
 * 
 * This module configures the PostgREST client for flexible querying of the NYCDB database.
 */

const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

// Configure PostgREST client
const postgrestClient = axios.create({
  baseURL: process.env.POSTGREST_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add authentication if configured
if (process.env.POSTGREST_TOKEN) {
  postgrestClient.defaults.headers.common['Authorization'] = `Bearer ${process.env.POSTGREST_TOKEN}`;
}

// Add response interceptor for error handling
postgrestClient.interceptors.response.use(
  response => response,
  error => {
    console.error('PostgREST API error:', error.response ? error.response.data : error.message);
    return Promise.reject(error);
  }
);

module.exports = postgrestClient;
