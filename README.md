# NYCDB Web Application

A modern web application for accessing and visualizing NYC housing data from the NYCDB project.

## Features

- Browse and search all NYCDB datasets
- Explore dataset details with advanced filtering and sorting
- Create data visualizations with charts and graphs
- View geospatial data on interactive maps
- User authentication with saved preferences
- Save and manage custom queries
- Responsive design for desktop and mobile

## Technology Stack

### Backend
- Node.js with Express
- TypeScript
- PostgreSQL database
- PostgREST for database API
- JWT authentication

### Frontend
- React with TypeScript
- Material-UI component library
- Redux for state management
- Recharts for data visualization
- Mapbox GL for interactive maps

## Prerequisites

- Node.js (v14+)
- npm or yarn
- PostgreSQL (v12+)
- Docker and Docker Compose (optional, for containerized setup)

## Installation

### Option 1: Local Setup

1. Clone the repository:
```
git clone https://github.com/yourusername/nycdb-web-app.git
cd nycdb-web-app
```

2. Set up the backend:
```
cd backend
npm install
cp .env.example .env
```

3. Configure the environment variables in the `.env` file:
```
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nycdb
DB_USER=postgres
DB_PASSWORD=your_password
```

4. Set up the frontend:
```
cd ../frontend
npm install
cp .env.example .env
```

5. Configure the frontend environment variables in the `.env` file:
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_MAPBOX_TOKEN=your_mapbox_token
```

### Option 2: Docker Setup

1. Clone the repository:
```
git clone https://github.com/yourusername/nycdb-web-app.git
cd nycdb-web-app
```

2. Create a `.env` file in the root directory:
```
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret
DB_HOST=postgres
DB_PORT=5432
DB_NAME=nycdb
DB_USER=postgres
DB_PASSWORD=your_password
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_MAPBOX_TOKEN=your_mapbox_token
```

3. Start the application using Docker Compose:
```
docker-compose up -d
```

## Setting up NYCDB Data

To populate the database with NYCDB datasets:

1. Install the NYCDB tool:
```
pip install nycdb
```

2. Download and load datasets:
```
# Download all datasets (this may take a while)
nycdb --download all

# Load all datasets into the database
nycdb --load all
```

Alternatively, you can download and load specific datasets:
```
nycdb --download hpd_violations
nycdb --load hpd_violations
```

## Running the Application

### Local Development

1. Start the backend:
```
cd backend
npm run dev
```

2. Start the frontend (in a separate terminal):
```
cd frontend
npm start
```

3. Access the application at http://localhost:3000

### Production Build

1. Build the backend:
```
cd backend
npm run build
```

2. Build the frontend:
```
cd frontend
npm run build
```

3. Start the production server:
```
cd backend
npm start
```

## Testing

### Backend Tests

Run the API tests:
```
cd backend
chmod +x test/api-test.sh
./test/api-test.sh
```

### Frontend Tests

Run the React component tests:
```
cd frontend
npm test
```

## Project Structure

```
nycdb-web-app/
├── backend/                 # Backend API server
│   ├── src/                 # Source code
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # API controllers
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # Data models
│   │   ├── routes/          # API routes
│   │   └── utils/           # Utility functions
│   ├── test/                # Test scripts
│   └── package.json         # Backend dependencies
├── frontend/                # React frontend
│   ├── public/              # Static files
│   ├── src/                 # Source code
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── store/           # Redux store
│   │   ├── tests/           # Component tests
│   │   └── App.tsx          # Main application component
│   └── package.json         # Frontend dependencies
├── docker-compose.yml       # Docker Compose configuration
└── README.md                # Project documentation
```

## API Documentation

The API provides the following endpoints:

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user profile

### Datasets

- `GET /api/datasets` - Get all available datasets
- `GET /api/datasets/:id` - Get dataset metadata
- `GET /api/datasets/:id/data` - Get dataset data with pagination, filtering, and sorting
- `GET /api/datasets/:id/aggregate` - Get aggregated data for visualizations

### User Preferences

- `GET /api/user/preferences` - Get user preferences
- `POST /api/user/preferences` - Save user preferences
- `GET /api/user/saved-queries` - Get user's saved queries
- `POST /api/user/saved-queries` - Save a new query
- `DELETE /api/user/saved-queries/:id` - Delete a saved query

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [NYCDB Project](https://github.com/nycdb/nycdb) for providing the datasets and tools
- [NYC Housing Data Coalition](https://www.housingdatanyc.org/) for their work on housing data
