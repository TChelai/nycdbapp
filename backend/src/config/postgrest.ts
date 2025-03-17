import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const postgrestUrl = process.env.POSTGREST_URL || 'http://localhost:3000';

const postgrestClient = axios.create({
  baseURL: postgrestUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default postgrestClient;
