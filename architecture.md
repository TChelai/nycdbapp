# NYCDB Web Application Architecture

## Overview

This document outlines the architecture for a web application that provides easy access to the NYCDB (NYC Database) project datasets. The application will feature a clean, user-friendly interface with modern web technologies and robust features for data exploration and visualization.

## System Architecture

The application will follow a modern client-server architecture with the following components:

### 1. Backend

- **API Server**: A Node.js Express server that will serve as the intermediary between the frontend and the database
- **Database**: PostgreSQL database populated with NYCDB datasets
- **PostgREST**: Used to expose the PostgreSQL database as a RESTful API
- **Authentication**: JWT-based authentication for secure access to the API

### 2. Frontend

- **Framework**: React.js with TypeScript for type safety and better developer experience
- **State Management**: Redux for global state management
- **UI Components**: Material-UI for a consistent and professional look
- **Data Visualization**: D3.js and React-Vis for charts and graphs
- **Mapping**: Mapbox GL JS for geospatial data visualization
- **Routing**: React Router for client-side routing

## Data Flow

1. The PostgreSQL database is populated with NYCDB datasets using the NYCDB Python tool
2. PostgREST exposes the database as a RESTful API
3. The Express backend server provides additional business logic, authentication, and proxies requests to PostgREST
4. The React frontend communicates with the Express backend via RESTful API calls
5. The frontend renders the data in various formats (tables, charts, maps) based on user interactions

## Key Features

### Backend Features

- RESTful API endpoints for all NYCDB datasets
- Query optimization for large datasets
- Pagination, filtering, and sorting capabilities
- Data aggregation for visualization purposes
- Caching for improved performance
- Authentication and authorization

### Frontend Features

1. **Dashboard**
   - Overview of available datasets
   - Quick access to frequently used data
   - Summary statistics and key metrics

2. **Data Explorer**
   - Advanced search and filtering capabilities
   - Sortable and paginated data tables
   - Export functionality (CSV, JSON)
   - Customizable views

3. **Visualization Tools**
   - Interactive charts and graphs
   - Time-series analysis
   - Comparative analysis between datasets

4. **Mapping Interface**
   - Geospatial visualization of property data
   - Heat maps for violations, complaints, etc.
   - Address-based search
   - District and neighborhood overlays

5. **User Features**
   - Saved searches and queries
   - Customizable dashboard
   - Shareable links to specific views

## Technical Stack

### Backend
- Node.js
- Express.js
- PostgreSQL
- PostgREST
- JWT for authentication

### Frontend
- React.js
- TypeScript
- Redux
- Material-UI
- D3.js / React-Vis
- Mapbox GL JS
- React Router

### DevOps
- Docker for containerization
- Docker Compose for local development
- Environment-based configuration

## Database Schema

The database schema will follow the NYCDB project's existing schema, which includes tables for:

- Property records (PLUTO)
- Building violations (DOB, HPD)
- Complaints
- Litigations
- Sales data
- Rent stabilization
- And many more

## API Endpoints

The API will provide endpoints for:

1. **Authentication**
   - `/api/auth/login`
   - `/api/auth/register`
   - `/api/auth/refresh`

2. **Datasets**
   - `/api/datasets` - List all available datasets
   - `/api/datasets/:id` - Get metadata for a specific dataset

3. **Data Access**
   - `/api/data/:dataset` - Query data from a specific dataset
   - `/api/data/:dataset/count` - Get count of records in a dataset
   - `/api/data/:dataset/aggregate` - Get aggregated data for visualizations

4. **User Preferences**
   - `/api/user/preferences` - Save and retrieve user preferences
   - `/api/user/saved-queries` - Manage saved queries

## Deployment Architecture

The application will be deployable in various environments:

1. **Development**: Local Docker setup with all components
2. **Production**: Cloud-based deployment with separate services for API, database, and frontend

## Security Considerations

- HTTPS for all communications
- JWT-based authentication
- Input validation and sanitization
- Rate limiting
- CORS configuration
- Database connection security

## Performance Considerations

- Database indexing for common queries
- Caching frequently accessed data
- Pagination for large datasets
- Lazy loading of components
- Code splitting for frontend
- Image and asset optimization

## Future Expansion

The architecture is designed to be extensible for future features:

- Advanced analytics
- Machine learning integration
- Real-time data updates
- Mobile application
- Public API for developers
