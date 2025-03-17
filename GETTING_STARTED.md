# Getting Started with NYCDB Web App

This document provides additional information to help you get started with the NYCDB Web Application.

## First-time Setup

When setting up the application for the first time, follow these steps:

1. Make sure you have all the prerequisites installed:
   - Node.js (v14+)
   - npm or yarn
   - PostgreSQL (v12+)
   - Docker and Docker Compose (optional)

2. Configure your database:
   - Create a PostgreSQL database named `nycdb`
   - Create a database user with appropriate permissions
   - Update the `.env` file with your database credentials

3. Install NYCDB and load data:
   - The application requires data from the NYCDB project
   - Follow the instructions in the main README.md to install and load NYCDB data
   - Note that loading all datasets can take several hours and require significant disk space

## User Guide

### Dashboard

The dashboard provides an overview of available datasets and quick access to visualizations and maps.

### Dataset Explorer

Browse and search through all available NYCDB datasets:
- Use the search box to filter datasets by name or description
- Click on a dataset card to view its details

### Dataset Detail View

Explore individual datasets with advanced features:
- View all data with pagination
- Add filters to narrow down results
- Sort data by clicking on column headers
- Save queries for future reference (requires login)

### Visualizations

Create charts to visualize trends in the data:
1. Select a dataset from the dropdown
2. Choose a field to group by
3. Select an aggregate function (count, sum, avg, etc.)
4. For functions other than count, select a numeric field to aggregate
5. Click "Generate Visualization" to create the chart

### Map View

Visualize geospatial data on interactive maps:
1. Select a dataset containing geographic coordinates
2. Choose the fields containing latitude and longitude data
3. Optionally select a numeric field to color-code the points
4. The map will display the data points on a map of New York City

### User Profile

Manage your account and saved items:
- View and update your account information
- Set application preferences
- Access and manage your saved queries

## Troubleshooting

### Database Connection Issues

If you encounter database connection issues:
1. Verify that PostgreSQL is running
2. Check that the database credentials in your `.env` file are correct
3. Ensure the database user has appropriate permissions
4. Confirm that the NYCDB datasets have been loaded correctly

### API Errors

If the API returns errors:
1. Check the backend logs for detailed error messages
2. Verify that all environment variables are set correctly
3. Ensure the JWT_SECRET is properly configured
4. Check that the database connection is working

### Frontend Issues

If the frontend doesn't load or displays errors:
1. Check the browser console for error messages
2. Verify that the REACT_APP_API_URL is set correctly
3. Clear your browser cache and reload the page
4. Ensure all frontend dependencies are installed

## Development Tips

### Adding New Features

To add new features to the application:
1. For backend changes, add new routes in the appropriate files in `backend/src/routes`
2. Implement controllers for new routes in `backend/src/controllers`
3. For frontend changes, add new components in `frontend/src/components`
4. Create new pages in `frontend/src/pages` if needed
5. Update Redux store in `frontend/src/store` for new state management

### Customizing the UI

To customize the application's appearance:
1. Modify the theme in `frontend/src/App.tsx`
2. Update component styles using Material-UI's styling system
3. Add custom CSS in component files as needed

### Deployment Considerations

When deploying to production:
1. Set NODE_ENV to "production"
2. Use a strong, unique JWT_SECRET
3. Configure proper CORS settings for your domain
4. Set up a reverse proxy (like Nginx) in front of the application
5. Use HTTPS for all connections
