/**
 * Test suite for AIQueryComponent
 * 
 * This file contains tests for the AI Query Component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import axios from 'axios';
import AIQueryComponent from '../components/AIQueryComponent';

// Mock axios
jest.mock('axios');

// Mock redux store
const mockStore = configureStore([]);
const store = mockStore({
  auth: {
    user: {
      id: 'test-user',
      name: 'Test User'
    }
  }
});

describe('AIQueryComponent', () => {
  beforeEach(() => {
    // Reset mocks
    axios.post.mockReset();
    axios.get.mockReset();
  });

  it('renders the component correctly', () => {
    render(
      <Provider store={store}>
        <AIQueryComponent />
      </Provider>
    );

    // Check for main elements
    expect(screen.getByText(/NYC Buildings Data AI Assistant/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ask a question about NYC buildings data/i)).toBeInTheDocument();
    expect(screen.getByText(/Submit/i)).toBeInTheDocument();
    expect(screen.getByText(/Example questions you can ask:/i)).toBeInTheDocument();
  });

  it('handles query submission correctly', async () => {
    // Mock successful API response
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        response: {
          insights: {
            summary: 'Test summary',
            keyFindings: ['Finding 1', 'Finding 2']
          },
          visualizations: [
            { type: 'barChart', title: 'Test Chart', data: [] }
          ],
          recommendations: ['Recommendation 1']
        }
      }
    });

    render(
      <Provider store={store}>
        <AIQueryComponent />
      </Provider>
    );

    // Type a query
    const inputField = screen.getByLabelText(/Ask a question about NYC buildings data/i);
    fireEvent.change(inputField, { target: { value: 'Show me buildings in Brooklyn with high risk' } });

    // Submit the query
    const submitButton = screen.getByText(/Submit/i);
    fireEvent.click(submitButton);

    // Wait for results to be displayed
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/ai/query', {
        query: 'Show me buildings in Brooklyn with high risk',
        userId: 'test-user',
        conversationId: null
      });
      expect(screen.getByText(/Test summary/i)).toBeInTheDocument();
      expect(screen.getByText(/Finding 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Recommendation 1/i)).toBeInTheDocument();
    });
  });

  it('displays error message when API call fails', async () => {
    // Mock failed API response
    axios.post.mockRejectedValueOnce({
      response: {
        data: {
          message: 'Failed to process query'
        }
      }
    });

    render(
      <Provider store={store}>
        <AIQueryComponent />
      </Provider>
    );

    // Type a query
    const inputField = screen.getByLabelText(/Ask a question about NYC buildings data/i);
    fireEvent.change(inputField, { target: { value: 'Invalid query' } });

    // Submit the query
    const submitButton = screen.getByText(/Submit/i);
    fireEvent.click(submitButton);

    // Wait for error message to be displayed
    await waitFor(() => {
      expect(screen.getByText(/Error/i)).toBeInTheDocument();
      expect(screen.getByText(/Failed to process query/i)).toBeInTheDocument();
    });
  });

  it('loads conversation history when component mounts', async () => {
    // Mock successful API response for conversation history
    axios.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: [
          { conversationId: 'conv1', lastQuery: 'Previous query 1' },
          { conversationId: 'conv2', lastQuery: 'Previous query 2' }
        ]
      }
    });

    render(
      <Provider store={store}>
        <AIQueryComponent />
      </Provider>
    );

    // Click show history button
    const historyButton = screen.getByText(/Show History/i);
    fireEvent.click(historyButton);

    // Wait for history to be displayed
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/ai/conversations', {
        params: { userId: 'test-user' }
      });
      expect(screen.getByText(/Previous query 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Previous query 2/i)).toBeInTheDocument();
    });
  });

  it('handles example query clicks correctly', () => {
    render(
      <Provider store={store}>
        <AIQueryComponent />
      </Provider>
    );

    // Find an example query chip
    const exampleQuery = screen.getByText(/Show me buildings in Brooklyn with a high risk of structural issues/i);
    
    // Click the example query
    fireEvent.click(exampleQuery);

    // Check that the input field was updated
    const inputField = screen.getByLabelText(/Ask a question about NYC buildings data/i);
    expect(inputField.value).toBe('Show me buildings in Brooklyn with a high risk of structural issues');
  });
});
