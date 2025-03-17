import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import Dashboard from '../pages/Dashboard';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe('Dashboard Component', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      datasets: {
        datasets: [
          { table_name: 'hpd_violations', description: 'Housing violations data' },
          { table_name: 'dob_violations', description: 'Building violations data' },
          { table_name: 'rentstab', description: 'Rent stabilization data' }
        ],
        loading: false,
        error: null
      },
      auth: {
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null
      }
    });
  });

  test('renders dashboard title', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText(/Welcome to NYCDB Explorer/i)).toBeInTheDocument();
  });

  test('displays datasets', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText('hpd_violations')).toBeInTheDocument();
    expect(screen.getByText('dob_violations')).toBeInTheDocument();
    expect(screen.getByText('rentstab')).toBeInTheDocument();
  });

  test('displays dataset descriptions', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText('Housing violations data')).toBeInTheDocument();
    expect(screen.getByText('Building violations data')).toBeInTheDocument();
    expect(screen.getByText('Rent stabilization data')).toBeInTheDocument();
  });

  test('displays visualization and map sections', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Dashboard />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText('Visualizations')).toBeInTheDocument();
    expect(screen.getByText('Map View')).toBeInTheDocument();
  });
});
