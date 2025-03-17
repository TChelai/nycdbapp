import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

// Define API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Define types
interface UserPreferences {
  [key: string]: any;
}

interface SavedQuery {
  id: number;
  name: string;
  dataset: string;
  query: any;
  description: string;
  created_at: string;
}

interface UserState {
  preferences: UserPreferences;
  savedQueries: SavedQuery[];
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: UserState = {
  preferences: {},
  savedQueries: [],
  loading: false,
  error: null
};

// Helper function to get auth header
const getAuthHeader = (getState: any) => {
  const token = (getState() as any).auth.token;
  
  if (!token) {
    throw new Error('No token, authorization denied');
  }
  
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

// Async thunks
export const getPreferences = createAsyncThunk(
  'user/getPreferences',
  async (_, { getState, rejectWithValue }) => {
    try {
      const config = getAuthHeader(getState);
      const response = await axios.get(`${API_URL}/user/preferences`, config);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get preferences');
    }
  }
);

export const savePreferences = createAsyncThunk(
  'user/savePreferences',
  async (preferences: UserPreferences, { getState, rejectWithValue }) => {
    try {
      const config = getAuthHeader(getState);
      const response = await axios.post(`${API_URL}/user/preferences`, { preferences }, config);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save preferences');
    }
  }
);

export const getSavedQueries = createAsyncThunk(
  'user/getSavedQueries',
  async (_, { getState, rejectWithValue }) => {
    try {
      const config = getAuthHeader(getState);
      const response = await axios.get(`${API_URL}/user/saved-queries`, config);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get saved queries');
    }
  }
);

export const saveQuery = createAsyncThunk(
  'user/saveQuery',
  async (
    queryData: { name: string; dataset: string; query: any; description?: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const config = getAuthHeader(getState);
      const response = await axios.post(`${API_URL}/user/saved-queries`, queryData, config);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save query');
    }
  }
);

export const deleteQuery = createAsyncThunk(
  'user/deleteQuery',
  async (queryId: number, { getState, rejectWithValue }) => {
    try {
      const config = getAuthHeader(getState);
      await axios.delete(`${API_URL}/user/saved-queries/${queryId}`, config);
      return queryId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete query');
    }
  }
);

// Create slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Get preferences
    builder.addCase(getPreferences.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getPreferences.fulfilled, (state, action) => {
      state.loading = false;
      state.preferences = action.payload.data.preferences || {};
    });
    builder.addCase(getPreferences.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Save preferences
    builder.addCase(savePreferences.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(savePreferences.fulfilled, (state, action) => {
      state.loading = false;
      state.preferences = action.payload.data.preferences;
    });
    builder.addCase(savePreferences.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Get saved queries
    builder.addCase(getSavedQueries.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(getSavedQueries.fulfilled, (state, action) => {
      state.loading = false;
      state.savedQueries = action.payload.data;
    });
    builder.addCase(getSavedQueries.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Save query
    builder.addCase(saveQuery.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(saveQuery.fulfilled, (state, action) => {
      state.loading = false;
      state.savedQueries.unshift(action.payload.data);
    });
    builder.addCase(saveQuery.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Delete query
    builder.addCase(deleteQuery.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteQuery.fulfilled, (state, action) => {
      state.loading = false;
      state.savedQueries = state.savedQueries.filter(query => query.id !== action.payload);
    });
    builder.addCase(deleteQuery.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  }
});

export const { clearUserError } = userSlice.actions;

export default userSlice.reducer;
