import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  CardActionArea,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { useEffect } from 'react';
import { fetchDatasets } from '../store/datasetSlice';

const Dashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { datasets, loading, error } = useSelector((state: RootState) => state.datasets);
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(fetchDatasets());
  }, [dispatch]);

  const handleDatasetClick = (datasetName: string) => {
    navigate(`/datasets/${datasetName}`);
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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome to NYCDB Explorer
          {isAuthenticated && user ? `, ${user.username}` : ''}
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Explore NYC housing data from various sources. This application provides access to datasets from the NYCDB project,
          allowing you to search, filter, and visualize housing-related information.
        </Typography>
      </Box>

      <Paper sx={{ p: 2, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Available Datasets
        </Typography>
        <Grid container spacing={3}>
          {datasets.slice(0, 6).map((dataset) => (
            <Grid item xs={12} sm={6} md={4} key={dataset.table_name}>
              <Card>
                <CardActionArea onClick={() => handleDatasetClick(dataset.table_name)}>
                  <CardContent>
                    <Typography variant="h6" component="div">
                      {dataset.table_name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {dataset.description || 'No description available'}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
        {datasets.length > 6 && (
          <Box sx={{ mt: 2, textAlign: 'right' }}>
            <Typography 
              variant="body2" 
              color="primary" 
              sx={{ cursor: 'pointer' }}
              onClick={() => navigate('/datasets')}
            >
              View all {datasets.length} datasets
            </Typography>
          </Box>
        )}
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h5" gutterBottom>
              Visualizations
            </Typography>
            <Typography variant="body1" paragraph>
              Create charts and graphs to visualize housing data trends and patterns.
            </Typography>
            <Typography 
              variant="body2" 
              color="primary" 
              sx={{ cursor: 'pointer' }}
              onClick={() => navigate('/visualizations')}
            >
              Explore visualizations
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h5" gutterBottom>
              Map View
            </Typography>
            <Typography variant="body1" paragraph>
              Explore housing data geographically with interactive maps.
            </Typography>
            <Typography 
              variant="body2" 
              color="primary" 
              sx={{ cursor: 'pointer' }}
              onClick={() => navigate('/map')}
            >
              Open map view
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
