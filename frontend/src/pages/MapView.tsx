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
  SelectChangeEvent,
  Tabs,
  Tab
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchDatasets } from '../store/datasetSlice';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import axios from 'axios';

// Define API base URL
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Mapbox token would typically come from environment variables
// For this demo, we're using a placeholder
const MAPBOX_TOKEN = 'pk.placeholder.mapbox.token';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`map-tabpanel-${index}`}
      aria-labelledby={`map-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const MapView: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { datasets, loading, error } = useSelector((state: RootState) => state.datasets);
  
  const [selectedDataset, setSelectedDataset] = useState('');
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [columns, setColumns] = useState<any[]>([]);
  const [selectedLatField, setSelectedLatField] = useState('');
  const [selectedLngField, setSelectedLngField] = useState('');
  const [selectedColorField, setSelectedColorField] = useState('');

  const mapContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(fetchDatasets());
  }, [dispatch]);

  useEffect(() => {
    if (selectedDataset) {
      fetchDatasetColumns();
    } else {
      setColumns([]);
      setSelectedLatField('');
      setSelectedLngField('');
      setSelectedColorField('');
    }
  }, [selectedDataset]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map only once
    if (!map) {
      const newMap = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/light-v10',
        center: [-74.0060, 40.7128], // New York City coordinates
        zoom: 10,
        accessToken: MAPBOX_TOKEN
      });

      newMap.on('load', () => {
        setMap(newMap);
      });

      return () => {
        newMap.remove();
      };
    }
  }, [map]);

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
  };

  const handleLatFieldChange = (event: SelectChangeEvent) => {
    setSelectedLatField(event.target.value);
  };

  const handleLngFieldChange = (event: SelectChangeEvent) => {
    setSelectedLngField(event.target.value);
  };

  const handleColorFieldChange = (event: SelectChangeEvent) => {
    setSelectedColorField(event.target.value);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const loadMapData = async () => {
    if (!map || !selectedDataset || !selectedLatField || !selectedLngField) {
      return;
    }

    setMapLoading(true);
    setMapError(null);

    try {
      // Fetch data for mapping
      const response = await axios.get(`${API_URL}/datasets/${selectedDataset}/data`, {
        params: {
          limit: 1000 // Limit to prevent performance issues
        }
      });

      const geoData = response.data.data.filter((item: any) => 
        item[selectedLatField] && item[selectedLngField]
      );

      // Remove existing layers and sources
      if (map.getSource('points')) {
        map.removeLayer('point-layer');
        map.removeSource('points');
      }

      // Add data as a source
      map.addSource('points', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: geoData.map((item: any) => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [parseFloat(item[selectedLngField]), parseFloat(item[selectedLatField])]
            },
            properties: {
              ...item,
              color: selectedColorField ? item[selectedColorField] : null
            }
          }))
        }
      });

      // Add a layer showing the points
      map.addLayer({
        id: 'point-layer',
        type: 'circle',
        source: 'points',
        paint: {
          'circle-radius': 5,
          'circle-color': selectedColorField 
            ? [
                'interpolate',
                ['linear'],
                ['get', selectedColorField],
                0, '#2196f3',
                50, '#4caf50',
                100, '#f44336'
              ]
            : '#3388ff',
          'circle-opacity': 0.8
        }
      });

      // Fit map to data bounds
      if (geoData.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        geoData.forEach((item: any) => {
          bounds.extend([parseFloat(item[selectedLngField]), parseFloat(item[selectedLatField])]);
        });
        map.fitBounds(bounds, { padding: 50 });
      }
    } catch (error: any) {
      console.error('Error loading map data:', error);
      setMapError(error.response?.data?.message || 'Failed to load map data');
    } finally {
      setMapLoading(false);
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
        Map View
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Visualize NYCDB data geographically on interactive maps.
      </Typography>

      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          <Tab label="Point Map" />
          <Tab label="Heat Map" disabled />
          <Tab label="Choropleth Map" disabled />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3} sx={{ mb: 3 }}>
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
                <InputLabel>Latitude Field</InputLabel>
                <Select
                  value={selectedLatField}
                  label="Latitude Field"
                  onChange={handleLatFieldChange}
                >
                  {columns
                    .filter(column => 
                      ['numeric', 'real', 'double precision'].includes(column.data_type)
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
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={!selectedDataset}>
                <InputLabel>Longitude Field</InputLabel>
                <Select
                  value={selectedLngField}
                  label="Longitude Field"
                  onChange={handleLngFieldChange}
                >
                  {columns
                    .filter(column => 
                      ['numeric', 'real', 'double precision'].includes(column.data_type)
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
            <Grid item xs={12} md={6}>
              <FormControl fullWidth disabled={!selectedDataset}>
                <InputLabel>Color Field (Optional)</InputLabel>
                <Select
                  value={selectedColorField}
                  label="Color Field (Optional)"
                  onChange={handleColorFieldChange}
                >
                  <MenuItem value="">None</MenuItem>
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
          </Grid>

          <Box 
            ref={mapContainerRef} 
            sx={{ 
              height: 500, 
              position: 'relative',
              '& .mapboxgl-canvas': {
                borderRadius: 1
              }
            }}
          >
            {mapLoading && (
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  bottom: 0, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  zIndex: 10
                }}
              >
                <CircularProgress />
              </Box>
            )}
            {mapError && (
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  right: 0, 
                  bottom: 0, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  zIndex: 10
                }}
              >
                <Typography variant="body1" color="error">
                  {mapError}
                </Typography>
              </Box>
            )}
          </Box>
        </TabPanel>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Map Usage Instructions
        </Typography>
        <Typography variant="body1" paragraph>
          1. Select a dataset containing geographic coordinates.
        </Typography>
        <Typography variant="body1" paragraph>
          2. Choose the fields containing latitude and longitude data.
        </Typography>
        <Typography variant="body1" paragraph>
          3. Optionally select a numeric field to color-code the points.
        </Typography>
        <Typography variant="body1" paragraph>
          4. Use mouse to pan and zoom the map. Click on points to see details.
        </Typography>
      </Paper>
    </Container>
  );
};

export default MapView;
