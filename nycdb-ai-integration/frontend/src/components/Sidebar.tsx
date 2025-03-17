// Update the Sidebar component to include a link to the new AI Analysis page

import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  Paper 
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  Storage as StorageIcon, 
  BarChart as BarChartIcon, 
  Map as MapIcon, 
  Person as PersonIcon,
  SmartToy as AIIcon
} from '@mui/icons-material';

const Sidebar: React.FC = () => {
  const location = useLocation();
  
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Datasets', icon: <StorageIcon />, path: '/datasets' },
    { text: 'Visualizations', icon: <BarChartIcon />, path: '/visualizations' },
    { text: 'Map View', icon: <MapIcon />, path: '/map' },
    { text: 'AI Analysis', icon: <AIIcon />, path: '/ai-analysis' },
    { text: 'Profile', icon: <PersonIcon />, path: '/profile' }
  ];

  return (
    <Paper elevation={0} sx={{ height: '100%', borderRadius: 0 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <List component="nav">
          {menuItems.map((item) => (
            <ListItem 
              button 
              component={RouterLink} 
              to={item.path} 
              key={item.text}
              selected={location.pathname === item.path}
              sx={{ 
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                  }
                }
              }}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
        <Divider />
      </Box>
    </Paper>
  );
};

export default Sidebar;
