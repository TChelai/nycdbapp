import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  SelectChangeEvent
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchDatasets } from '../store/datasetSlice';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

// Define API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Visualizations: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { datasets, loading, error } = useSelector((state: RootState) => state.datasets);
  
  const [selectedDataset, setSelectedDataset] = useState('');
  const [selectedGroupBy, setSelectedGroupBy] = useState('');
  const [selectedAggregateFunc, setSelectedAggregateFunc] = useState('count');
  const [selectedValueField, setSelectedValueField] = useState('');
  const [columns, setColumns] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchDatasets());
  }, [dispatch]);

  useEffect(() => {
    if (selectedDataset) {
      fetchDatasetColumns();
    } else {
      setColumns([]);
      setSelectedGroupBy('');
      setSelectedValueField('');
    }
  }, [selectedDataset]);

  const fetchDatasetColumns = async () => {
    try {
      const response = await axios.get(`${API_URL}/datasets/${selectedDataset}`);
      setColumns(response.data.data);
    } catch (error) {
      console.error('Error fetching dataset columns:', error);
    }
  };

  const handleDatasetChange = (event: SelectChangeEvent) => {
    setSelectedDataset(event.target.value);
    setChartData([]);
  };

  const handleGroupByChange = (event: SelectChangeEvent) => {
    setSelectedGroupBy(event.target.value);
  };

  const handleAggregateFuncChange = (event: SelectChangeEvent) => {
    setSelectedAggregateFunc(event.target.value);
  };

  const handleValueFieldChange = (event: SelectChangeEvent) => {
    setSelectedValueField(event.target.value);
  };

  const generateVisualization = async () => {
    if (!selectedDataset || !selectedGroupBy || !selectedAggregateFunc || 
        (selectedAggregateFunc !== 'count' && !selectedValueField)) {
      return;
    }

    setChartLoading(true);
    setChartError(null);

    try {
      const valueField = selectedAggregateFunc === 'count' ? 'id' : selectedValueField;
      const response = await axios.get(`${API_URL}/datasets/${selectedDataset}/aggregate`, {
        params: {
          groupBy: selectedGroupBy,
          aggregateFunc: selectedAggregateFunc,
          valueField
        }
      });
      
      setChartData(response.data.data);
    } catch (error: any) {
      console.error('Error generating visualization:', error);
      setChartError(error.response?.data?.message || 'Failed to generate visualization');
    } finally {
      setChartLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" color="error" gutterBottom>
          Error loading datasets
        </Typography>
        <Typography variant="body1">{error}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Data Visualizations
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Create visualizations from NYCDB datasets to explore patterns and trends in the data.
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Visualization Settings
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Dataset</InputLabel>
              <Select
                value={selectedDataset}
                label="Dataset"
                onChange={handleDatasetChange}
              >
                {datasets.map((dataset) => (
                  <MenuItem key={dataset.table_name} value={dataset.table_name}>
                    {dataset.table_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth disabled={!selectedDataset}>
              <InputLabel>Group By</InputLabel>
              <Select
                value={selectedGroupBy}
                label="Group By"
                onChange={handleGroupByChange}
              >
                {columns.map((column) => (
                  <MenuItem key={column.column_name} value={column.column_name}>
                    {column.column_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth disabled={!selectedDataset}>
              <InputLabel>Aggregate Function</InputLabel>
              <Select
                value={selectedAggregateFunc}
                label="Aggregate Function"
                onChange={handleAggregateFuncChange}
              >
                <MenuItem value="count">Count</MenuItem>
                <MenuItem value="sum">Sum</MenuItem>
                <MenuItem value="avg">Average</MenuItem>
                <MenuItem value="min">Minimum</MenuItem>
                <MenuItem value="max">Maximum</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl 
              fullWidth 
              disabled={!selectedDataset || selectedAggregateFunc === 'count'}
            >
              <InputLabel>Value Field</InputLabel>
              <Select
                value={selectedValueField}
                label="Value Field"
                onChange={handleValueFieldChange}
              >
                {columns
                  .filter(column => 
                    ['integer', 'numeric', 'real', 'double precision'].includes(column.data_type)
                  )
                  .map((column) => (
                    <MenuItem key={column.column_name} value={column.column_name}>
                      {column.column_name}
                    </MenuItem>
                  ))
                }
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Button 
              variant="contained" 
              onClick={generateVisualization}
              disabled={
                !selectedDataset || 
                !selectedGroupBy || 
                !selectedAggregateFunc || 
                (selectedAggregateFunc !== 'count' && !selectedValueField)
              }
            >
              Generate Visualization
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Visualization
        </Typography>
        
        {chartLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="400px">
            <CircularProgress />
          </Box>
        ) : chartError ? (
          <Box sx={{ p: 2 }}>
            <Typography variant="body1" color="error">
              {chartError}
            </Typography>
          </Box>
        ) : chartData.length > 0 ? (
          <Box sx={{ height: 400, mt: 2 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 60,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="category" 
                  angle={-45} 
                  textAnchor="end"
                  height={70}
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="value" 
                  name={`${selectedAggregateFunc} of ${selectedAggregateFunc === 'count' ? 'records' : selectedValueField}`} 
                  fill="#8884d8" 
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        ) : (
          <Box sx={{ p: 2 }}>
            <Typography variant="body1" color="text.secondary">
              Select dataset and parameters, then click "Generate Visualization" to create a chart.
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Visualizations;
