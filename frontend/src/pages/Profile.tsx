import React, { useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  CircularProgress,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { loadUser } from '../store/authSlice';
import { getPreferences, savePreferences, getSavedQueries, deleteQuery } from '../store/userSlice';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSelector((state: RootState) => state.auth);
  const { preferences, savedQueries, loading: userLoading, error } = useSelector((state: RootState) => state.user);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [queryToDelete, setQueryToDelete] = React.useState<number | null>(null);
  const [themePreference, setThemePreference] = React.useState('light');
  const [defaultPageSize, setDefaultPageSize] = React.useState('25');

  useEffect(() => {
    dispatch(loadUser());
    dispatch(getPreferences());
    dispatch(getSavedQueries());
  }, [dispatch]);

  useEffect(() => {
    if (preferences) {
      setThemePreference(preferences.theme || 'light');
      setDefaultPageSize(preferences.defaultPageSize || '25');
    }
  }, [preferences]);

  const handleSavePreferences = () => {
    dispatch(savePreferences({
      theme: themePreference,
      defaultPageSize
    }));
  };

  const handleDeleteQuery = (queryId: number) => {
    setQueryToDelete(queryId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteQuery = () => {
    if (queryToDelete !== null) {
      dispatch(deleteQuery(queryToDelete));
      setDeleteDialogOpen(false);
      setQueryToDelete(null);
    }
  };

  const handleLoadQuery = (query: any) => {
    navigate(`/datasets/${query.dataset}`);
  };

  if (authLoading || userLoading) {
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
          Error loading profile
        </Typography>
        <Typography variant="body1">{error}</Typography>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" color="error" gutterBottom>
          User not found
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        User Profile
      </Typography>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Account Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Username
              </Typography>
              <Typography variant="body1">
                {user.username}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Email
              </Typography>
              <Typography variant="body1">
                {user.email}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Preferences
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Theme"
                  value={themePreference}
                  onChange={(e) => setThemePreference(e.target.value)}
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Default Page Size"
                  value={defaultPageSize}
                  onChange={(e) => setDefaultPageSize(e.target.value)}
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Button 
                  variant="contained" 
                  onClick={handleSavePreferences}
                  sx={{ mt: 1 }}
                >
                  Save Preferences
                </Button>
              </Grid>
            </Grid>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Saved Queries
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {savedQueries.length === 0 ? (
              <Typography variant="body1" color="text.secondary">
                You don't have any saved queries yet. You can save queries while exploring datasets.
              </Typography>
            ) : (
              <List>
                {savedQueries.map((query) => (
                  <Card key={query.id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="h6" component="div">
                        {query.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Dataset: {query.dataset}
                      </Typography>
                      {query.description && (
                        <Typography variant="body2" paragraph>
                          {query.description}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          color="error"
                          onClick={() => handleDeleteQuery(query.id)}
                        >
                          Delete
                        </Button>
                        <Button 
                          size="small" 
                          variant="contained"
                          onClick={() => handleLoadQuery(query)}
                        >
                          Load Query
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this saved query? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDeleteQuery} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile;
