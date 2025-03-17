import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

// Define API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Define types
interface Dataset {
  table_name: string;
  description: string;
}

interface DatasetMetadata {
  column_name: string;
  data_type: string;
  description: string;
}

interface DatasetState {
  datasets: Dataset[];
  currentDataset: string | null;
  metadata: DatasetMetadata[];
  data: any[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  page: number;
  limit: number;
  filter: string;
  order: string;
}

// Initial state
const initialState: DatasetState = {
  datasets: [],
  currentDataset: null,
  metadata: [],
  data: [],
  loading: false,
  error: null,
  totalCount: 0,
  page: 0,
  limit: 25,
  filter: '',
  order: ''
};

// Async thunks
export const fetchDatasets = createAsyncThunk(
  'datasets/fetchDatasets',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/datasets`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch datasets');
    }
  }
);

export const fetchDatasetMetadata = createAsyncThunk(
  'datasets/fetchDatasetMetadata',
  async (datasetId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/datasets/${datasetId}`);
      return { datasetId, data: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch dataset metadata');
    }
  }
);

export const fetchDatasetData = createAsyncThunk(
  'datasets/fetchDatasetData',
  async (
    { 
      datasetId, 
      page, 
      limit, 
      filter, 
      order 
    }: { 
      datasetId: string; 
      page: number; 
      limit: number; 
      filter?: string; 
      order?: string 
    }, 
    { rejectWithValue }
  ) => {
    try {
      const offset = page * limit;
      const params: any = { limit, offset };
      
      if (filter) params.filter = filter;
      if (order) params.order = order;
      
      const response = await axios.get(`${API_URL}/datasets/${datasetId}/data`, { params });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch dataset data');
    }
  }
);

// Create slice
const datasetSlice = createSlice({
  name: 'datasets',
  initialState,
  reducers: {
    setCurrentDataset: (state, action: PayloadAction<string>) => {
      state.currentDataset = action.payload;
      state.page = 0;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    setLimit: (state, action: PayloadAction<number>) => {
      state.limit = action.payload;
      state.page = 0;
    },
    setFilter: (state, action: PayloadAction<string>) => {
      state.filter = action.payload;
      state.page = 0;
    },
    setOrder: (state, action: PayloadAction<string>) => {
      state.order = action.payload;
    },
    clearData: (state) => {
      state.data = [];
      state.totalCount = 0;
    }
  },
  extraReducers: (builder) => {
    // Fetch datasets
    builder.addCase(fetchDatasets.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchDatasets.fulfilled, (state, action) => {
      state.loading = false;
      state.datasets = action.payload.data;
    });
    builder.addCase(fetchDatasets.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Fetch dataset metadata
    builder.addCase(fetchDatasetMetadata.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchDatasetMetadata.fulfilled, (state, action) => {
      state.loading = false;
      state.metadata = action.payload.data.data;
    });
    builder.addCase(fetchDatasetMetadata.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
    
    // Fetch dataset data
    builder.addCase(fetchDatasetData.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchDatasetData.fulfilled, (state, action) => {
      state.loading = false;
      state.data = action.payload.data;
      state.totalCount = action.payload.total;
    });
    builder.addCase(fetchDatasetData.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  }
});

export const { 
  setCurrentDataset, 
  setPage, 
  setLimit, 
  setFilter, 
  setOrder,
  clearData
} = datasetSlice.actions;

export default datasetSlice.reducer;
