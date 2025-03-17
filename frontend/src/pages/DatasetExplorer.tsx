import React, { useEffect, useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  CircularProgress,
  TextField,
  InputAdornment,
  IconButton,
  Pagination
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchDatasets, setCurrentDataset } from '../store/datasetSlice';
import { useNavigate } from 'react-router-dom';

const DatasetExplorer: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { datasets, loading, error } = useSelector((state: RootState) => state.datasets);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    dispatch(fetchDatasets());
  }, [dispatch]);

  const handleDatasetClick = (datasetName: string) => {
    dispatch(setCurrentDataset(datasetName));
    navigate(`/datasets/${datasetName}`);
  };

  const filteredDatasets = datasets.filter(dataset => 
    dataset.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dataset.description && dataset.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const paginatedDatasets = filteredDatasets.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo(0, 0);
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
        Dataset Explorer
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Browse and search through all available NYCDB datasets. Click on a dataset to explore its data.
      </Typography>

      <Paper sx={{ p: 2, mb: 4 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search datasets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 3 }}
        />

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Showing {filteredDatasets.length} datasets
        </Typography>

        <Grid container spacing={3}>
          {paginatedDatasets.map((dataset) => (
            <Grid item xs={12} sm={6} md={4} key={dataset.table_name}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 6
                  }
                }}
                onClick={() => handleDatasetClick(dataset.table_name)}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="div" gutterBottom>
                    {dataset.table_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {dataset.description || 'No description available'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {filteredDatasets.length > itemsPerPage && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination 
              count={Math.ceil(filteredDatasets.length / itemsPerPage)} 
              page={page} 
              onChange={handlePageChange} 
              color="primary" 
            />
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default DatasetExplorer;
