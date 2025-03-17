import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import Login from '../pages/Login';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe('Login Component', () => {
  let store;
  const mockNavigate = jest.fn();

  beforeEach(() => {
    store = mockStore({
      auth: {
        isAuthenticated: false,
        loading: false,
        error: null
      }
    });
    
    // Mock useNavigate
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate
    }));
  });

  test('renders login form', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText(/Sign In/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  test('displays link to registration page', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText(/Don't have an account\? Sign Up/i)).toBeInTheDocument();
  });

  test('validates form inputs', async () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </Provider>
    );
    
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    
    // Try submitting with empty fields
    fireEvent.click(submitButton);
    
    // Check that required validation is working
    await waitFor(() => {
      expect(emailInput).toBeInvalid();
      expect(passwordInput).toBeInvalid();
    });
    
    // Fill in the fields
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    // Fields should now be valid
    await waitFor(() => {
      expect(emailInput).toBeValid();
      expect(passwordInput).toBeValid();
    });
  });

  test('displays error message when login fails', () => {
    const storeWithError = mockStore({
      auth: {
        isAuthenticated: false,
        loading: false,
        error: 'Invalid credentials'
      }
    });
    
    render(
      <Provider store={storeWithError}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </Provider>
    );
    
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });

  test('shows loading indicator during authentication', () => {
    const loadingStore = mockStore({
      auth: {
        isAuthenticated: false,
        loading: true,
        error: null
      }
    });
    
    render(
      <Provider store={loadingStore}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </Provider>
    );
    
    // Button should be disabled and show loading indicator
    const submitButton = screen.getByRole('button', { name: /Sign In/i });
    expect(submitButton).toBeDisabled();
  });
});
