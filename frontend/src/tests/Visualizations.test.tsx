import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import Visualizations from '../pages/Visualizations';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe('Visualizations Component', () => {
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
      }
    });
  });

  test('renders visualizations title', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Visualizations />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText(/Data Visualizations/i)).toBeInTheDocument();
  });

  test('displays visualization settings form', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Visualizations />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText(/Visualization Settings/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Dataset/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Group By/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Aggregate Function/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Value Field/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate Visualization/i })).toBeInTheDocument();
  });

  test('generate button is disabled when required fields are not selected', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Visualizations />
        </BrowserRouter>
      </Provider>
    );
    
    const generateButton = screen.getByRole('button', { name: /Generate Visualization/i });
    expect(generateButton).toBeDisabled();
  });

  test('displays datasets in dropdown', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Visualizations />
        </BrowserRouter>
      </Provider>
    );
    
    const datasetSelect = screen.getByLabelText(/Dataset/i);
    fireEvent.mouseDown(datasetSelect);
    
    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeInTheDocument();
    
    expect(screen.getByText('hpd_violations')).toBeInTheDocument();
    expect(screen.getByText('dob_violations')).toBeInTheDocument();
    expect(screen.getByText('rentstab')).toBeInTheDocument();
  });

  test('displays loading state correctly', () => {
    const loadingStore = mockStore({
      datasets: {
        datasets: [],
        loading: true,
        error: null
      }
    });
    
    render(
      <Provider store={loadingStore}>
        <BrowserRouter>
          <Visualizations />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('displays error state correctly', () => {
    const errorStore = mockStore({
      datasets: {
        datasets: [],
        loading: false,
        error: 'Failed to load datasets'
      }
    });
    
    render(
      <Provider store={errorStore}>
        <BrowserRouter>
          <Visualizations />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText('Error loading datasets')).toBeInTheDocument();
    expect(screen.getByText('Failed to load datasets')).toBeInTheDocument();
  });
});
