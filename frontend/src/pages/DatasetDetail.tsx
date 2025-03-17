import React, { useEffect, useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  CircularProgress,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import SaveIcon from '@mui/icons-material/Save';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { 
  fetchDatasetMetadata, 
  fetchDatasetData, 
  setPage, 
  setLimit, 
  setFilter,
  setOrder
} from '../store/datasetSlice';
import { saveQuery } from '../store/userSlice';

const DatasetDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const { 
    metadata, 
    data, 
    loading, 
    error, 
    totalCount, 
    page, 
    limit 
  } = useSelector((state: RootState) => state.datasets);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filterField, setFilterField] = useState('');
  const [filterOperator, setFilterOperator] = useState('eq');
  const [filterValue, setFilterValue] = useState('');
  const [filterChips, setFilterChips] = useState<Array<{field: string, operator: string, value: string}>>([]);
  
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const [queryName, setQueryName] = useState('');
  const [queryDescription, setQueryDescription] = useState('');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchDatasetMetadata(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (id) {
      let filterString = '';
      if (filterChips.length > 0) {
        filterString = filterChips
          .map(chip => {
            const op = getOperatorSymbol(chip.operator);
            return `${chip.field}.${op}.${chip.value}`;
          })
          .join(',');
      }
      
      let orderString = '';
      if (sortField) {
        orderString = `${sortField}.${sortDirection}`;
      }
      
      dispatch(fetchDatasetData({ 
        datasetId: id, 
        page, 
        limit, 
        filter: filterString,
        order: orderString
      }));
    }
  }, [dispatch, id, page, limit, filterChips, sortField, sortDirection]);

  const getOperatorSymbol = (operator: string) => {
    switch (operator) {
      case 'eq': return 'eq';
      case 'gt': return 'gt';
      case 'lt': return 'lt';
      case 'gte': return 'gte';
      case 'lte': return 'lte';
      case 'like': return 'like';
      default: return 'eq';
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    dispatch(setPage(newPage));
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setLimit(parseInt(event.target.value, 10)));
  };

  const handleAddFilter = () => {
    if (filterField && filterValue) {
      setFilterChips([...filterChips, {
        field: filterField,
        operator: filterOperator,
        value: filterValue
      }]);
      setFilterField('');
      setFilterValue('');
      setFilterDialogOpen(false);
    }
  };

  const handleRemoveFilter = (index: number) => {
    const newFilters = [...filterChips];
    newFilters.splice(index, 1);
    setFilterChips(newFilters);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSaveQuery = () => {
    if (id && queryName) {
      let filterString = '';
      if (filterChips.length > 0) {
        filterString = filterChips
          .map(chip => {
            const op = getOperatorSymbol(chip.operator);
            return `${chip.field}.${op}.${chip.value}`;
          })
          .join(',');
      }
      
      let orderString = '';
      if (sortField) {
        orderString = `${sortField}.${sortDirection}`;
      }
      
      dispatch(saveQuery({
        name: queryName,
        dataset: id,
        query: {
          filter: filterString,
          order: orderString,
          limit
        },
        description: queryDescription
      }));
      
      setSaveDialogOpen(false);
      setQueryName('');
      setQueryDescription('');
    }
  };

  if (loading && !data.length) {
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
          Error loading dataset
        </Typography>
        <Typography variant="body1">{error}</Typography>
      </Container>
    );
  }

  if (!id) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" color="error" gutterBottom>
          Dataset not found
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dataset: {id}
      </Typography>

      <Paper sx={{ p: 2, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">Data Explorer</Typography>
          <Box>
            <Button 
              variant="outlined" 
              startIcon={<FilterListIcon />}
              onClick={() => setFilterDialogOpen(true)}
              sx={{ mr: 1 }}
            >
              Add Filter
            </Button>
            {isAuthenticated && (
              <Button 
                variant="outlined" 
                startIcon={<SaveIcon />}
                onClick={() => setSaveDialogOpen(true)}
              >
                Save Query
              </Button>
            )}
          </Box>
        </Box>

        {filterDialogOpen && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Add Filter</Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Field</InputLabel>
                  <Select
                    value={filterField}
                    label="Field"
                    onChange={(e: SelectChangeEvent) => setFilterField(e.target.value)}
                  >
                    {metadata.map((column) => (
                      <MenuItem key={column.column_name} value={column.column_name}>
                        {column.column_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Operator</InputLabel>
                  <Select
                    value={filterOperator}
                    label="Operator"
                    onChange={(e: SelectChangeEvent) => setFilterOperator(e.target.value)}
                  >
                    <MenuItem value="eq">Equals</MenuItem>
                    <MenuItem value="gt">Greater Than</MenuItem>
                    <MenuItem value="lt">Less Than</MenuItem>
                    <MenuItem value="gte">Greater Than or Equal</MenuItem>
                    <MenuItem value="lte">Less Than or Equal</MenuItem>
                    <MenuItem value="like">Contains</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Value"
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button 
                  variant="contained" 
                  onClick={handleAddFilter}
                  fullWidth
                >
                  Add
                </Button>
              </Grid>
            </Grid>
          </Paper>
        )}

        {saveDialogOpen && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>Save Query</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Query Name"
                  value={queryName}
                  onChange={(e) => setQueryName(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description (Optional)"
                  value={queryDescription}
                  onChange={(e) => setQueryDescription(e.target.value)}
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  variant="outlined" 
                  onClick={() => setSaveDialogOpen(false)}
                  sx={{ mr: 1 }}
                >
                  Cancel
                </Button>
                <Button 
                  variant="contained" 
                  onClick={handleSaveQuery}
                  disabled={!queryName}
                >
                  Save
                </Button>
              </Grid>
            </Grid>
          </Paper>
        )}

        {filterChips.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Active Filters:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {filterChips.map((chip, index) => (
                <Chip
                  key={index}
                  label={`${chip.field} ${chip.operator} ${chip.value}`}
                  onDelete={() => handleRemoveFilter(index)}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                {metadata.map((column) => (
                  <TableCell 
                    key={column.column_name}
                    onClick={() => handleSort(column.column_name)}
                    sx={{ 
                      cursor: 'pointer',
                      fontWeight: sortField === column.column_name ? 'bold' : 'normal',
                      '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                    }}
                  >
                    {column.column_name}
                    {sortField === column.column_name && (
                      <Box component="span" sx={{ ml: 0.5 }}>
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </Box>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {metadata.map((column) => (
                    <TableCell key={`${rowIndex}-${column.column_name}`}>
                      {row[column.column_name] !== null ? String(row[column.column_name]) : ''}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={totalCount}
          rowsPerPage={limit}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Dataset Metadata</Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Column Name</TableCell>
                <TableCell>Data Type</TableCell>
                <TableCell>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {metadata.map((column) => (
                <TableRow key={column.column_name}>
                  <TableCell>{column.column_name}</TableCell>
                  <TableCell>{column.data_type}</TableCell>
                  <TableCell>{column.description || 'No description available'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default DatasetDetail;
