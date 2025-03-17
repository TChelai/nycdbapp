// Update the App.tsx file to include the new AI Analysis page in the routing

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store';

// Import components and pages
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import DatasetExplorer from './pages/DatasetExplorer';
import DatasetDetail from './pages/DatasetDetail';
import Visualizations from './pages/Visualizations';
import MapView from './pages/MapView';
import NotFound from './pages/NotFound';
import AIAnalysisPage from './pages/AIAnalysisPage';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } />
            <Route path="/profile" element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            } />
            <Route path="/datasets" element={
              <PrivateRoute>
                <DatasetExplorer />
              </PrivateRoute>
            } />
            <Route path="/datasets/:id" element={
              <PrivateRoute>
                <DatasetDetail />
              </PrivateRoute>
            } />
            <Route path="/visualizations" element={
              <PrivateRoute>
                <Visualizations />
              </PrivateRoute>
            } />
            <Route path="/map" element={
              <PrivateRoute>
                <MapView />
              </PrivateRoute>
            } />
            {/* Add the new AI Analysis page route */}
            <Route path="/ai-analysis" element={
              <PrivateRoute>
                <AIAnalysisPage />
              </PrivateRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
    </Provider>
  );
};

export default App;
