import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import DatasetExplorer from '../pages/DatasetExplorer';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe('DatasetExplorer Component', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      datasets: {
        datasets: [
          { table_name: 'hpd_violations', description: 'Housing violations data' },
          { table_name: 'dob_violations', description: 'Building violations data' },
          { table_name: 'rentstab', description: 'Rent stabilization data' },
          { table_name: 'acris', description: 'Property records data' }
        ],
        loading: false,
        error: null
      }
    });
  });

  test('renders dataset explorer title', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <DatasetExplorer />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText(/Dataset Explorer/i)).toBeInTheDocument();
  });

  test('displays all datasets', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <DatasetExplorer />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText('hpd_violations')).toBeInTheDocument();
    expect(screen.getByText('dob_violations')).toBeInTheDocument();
    expect(screen.getByText('rentstab')).toBeInTheDocument();
    expect(screen.getByText('acris')).toBeInTheDocument();
  });

  test('search functionality filters datasets', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <DatasetExplorer />
        </BrowserRouter>
      </Provider>
    );
    
    const searchInput = screen.getByPlaceholderText('Search datasets...');
    fireEvent.change(searchInput, { target: { value: 'violations' } });
    
    // Should show violations datasets but not others
    expect(screen.getByText('hpd_violations')).toBeInTheDocument();
    expect(screen.getByText('dob_violations')).toBeInTheDocument();
    expect(screen.queryByText('rentstab')).not.toBeInTheDocument();
    expect(screen.queryByText('acris')).not.toBeInTheDocument();
  });

  test('displays dataset count correctly', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <DatasetExplorer />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText('Showing 4 datasets')).toBeInTheDocument();
    
    const searchInput = screen.getByPlaceholderText('Search datasets...');
    fireEvent.change(searchInput, { target: { value: 'violations' } });
    
    expect(screen.getByText('Showing 2 datasets')).toBeInTheDocument();
  });
});
