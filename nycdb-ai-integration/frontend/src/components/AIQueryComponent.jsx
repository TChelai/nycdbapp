/**
 * AI Query Component for NYCDB Web App
 * 
 * This component provides a user interface for submitting natural language queries
 * about NYC Department of Buildings data and viewing the generated insights.
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  CircularProgress,
  Divider,
  Chip,
  IconButton,
  Collapse,
  Card,
  CardContent,
  CardHeader,
  Grid
} from '@mui/material';
import { 
  Send as SendIcon, 
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import axios from 'axios';

// Import visualization components
import { 
  LineChart, 
  BarChart, 
  PieChart, 
  DataTable 
} from '../components/Visualizations';

const AIQueryComponent = () => {
  // State for the query input
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  
  // Get the current user from Redux store
  const { user } = useSelector(state => state.auth);
  
  // Ref for the results container to scroll to it when results arrive
  const resultsRef = useRef(null);
  
  // Example queries to help users get started
  const exampleQueries = [
    "Show me buildings in Brooklyn with a high risk of structural issues",
    "What are the most common violations in Manhattan high-rises?",
    "Has construction activity increased in Queens over the past five years?",
    "Are there buildings in the Bronx with signs of illegal renovations?",
    "Which neighborhoods have the oldest residential buildings?"
  ];
  
  // Load conversation history when component mounts
  useEffect(() => {
    if (user && user.id) {
      fetchConversationHistory();
    }
  }, [user]);
  
  // Fetch conversation history from the API
  const fetchConversationHistory = async () => {
    try {
      const response = await axios.get('/api/ai/conversations', {
        params: { userId: user.id }
      });
      
      if (response.data.success) {
        setConversationHistory(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching conversation history:', error);
    }
  };
  
  // Handle query submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/ai/query', {
        query: query.trim(),
        userId: user ? user.id : 'anonymous',
        conversationId
      });
      
      if (response.data.success) {
        setResponse(response.data.response);
        setConversationId(response.data.response.conversationId);
        
        // Refresh conversation history
        if (user && user.id) {
          fetchConversationHistory();
        }
        
        // Scroll to results
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        setError(response.data.message || 'Failed to process query');
      }
    } catch (error) {
      console.error('Error submitting query:', error);
      setError(error.response?.data?.message || 'An error occurred while processing your query');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle clicking on an example query
  const handleExampleClick = (exampleQuery) => {
    setQuery(exampleQuery);
  };
  
  // Handle clicking on a history item
  const handleHistoryClick = async (conversationId) => {
    try {
      const response = await axios.get(`/api/ai/conversations/${conversationId}`, {
        params: { userId: user.id }
      });
      
      if (response.data.success) {
        // Get the last query from the conversation
        const conversation = response.data.data;
        if (conversation.queries && conversation.queries.length > 0) {
          const lastQuery = conversation.queries[conversation.queries.length - 1];
          setQuery(lastQuery.query);
          setConversationId(conversationId);
        }
      }
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  };
  
  // Reset the form and start a new conversation
  const handleReset = () => {
    setQuery('');
    setResponse(null);
    setError(null);
    setConversationId(null);
  };
  
  // Render visualizations based on the response
  const renderVisualizations = () => {
    if (!response || !response.visualizations || response.visualizations.length === 0) {
      return null;
    }
    
    return (
      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Visualizations
        </Typography>
        <Grid container spacing={3}>
          {response.visualizations.map((viz, index) => (
            <Grid item xs={12} md={viz.type === 'table' ? 12 : 6} key={index}>
              <Card>
                <CardHeader title={viz.title} />
                <CardContent>
                  {renderVisualization(viz)}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };
  
  // Render a specific visualization based on its type
  const renderVisualization = (visualization) => {
    switch (visualization.type) {
      case 'lineChart':
        return (
          <LineChart 
            data={visualization.data} 
            config={visualization.config} 
          />
        );
      case 'barChart':
        return (
          <BarChart 
            data={visualization.data} 
            config={visualization.config} 
          />
        );
      case 'pieChart':
        return (
          <PieChart 
            data={visualization.data} 
            config={visualization.config} 
          />
        );
      case 'table':
        return (
          <DataTable 
            data={visualization.data} 
            config={visualization.config} 
          />
        );
      default:
        return (
          <Typography color="textSecondary">
            Unsupported visualization type: {visualization.type}
          </Typography>
        );
    }
  };
  
  // Render key findings from the response
  const renderKeyFindings = () => {
    if (!response || !response.insights || !response.insights.keyFindings || response.insights.keyFindings.length === 0) {
      return null;
    }
    
    return (
      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Key Findings
        </Typography>
        <Paper elevation={1} sx={{ p: 2 }}>
          <ul>
            {response.insights.keyFindings.map((finding, index) => (
              <li key={index}>
                <Typography paragraph>{finding}</Typography>
              </li>
            ))}
          </ul>
        </Paper>
      </Box>
    );
  };
  
  // Render recommendations from the response
  const renderRecommendations = () => {
    if (!response || !response.recommendations || response.recommendations.length === 0) {
      return null;
    }
    
    return (
      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Recommendations
        </Typography>
        <Paper elevation={1} sx={{ p: 2 }}>
          <ul>
            {response.recommendations.map((recommendation, index) => (
              <li key={index}>
                <Typography paragraph>{recommendation}</Typography>
              </li>
            ))}
          </ul>
        </Paper>
      </Box>
    );
  };
  
  // Render patterns and anomalies from the response
  const renderPatterns = () => {
    if (!response || !response.patterns || 
        (!response.patterns.significantPatterns || response.patterns.significantPatterns.length === 0) && 
        (!response.patterns.anomalies || response.patterns.anomalies.length === 0)) {
      return null;
    }
    
    return (
      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Patterns & Anomalies
        </Typography>
        <Paper elevation={1} sx={{ p: 2 }}>
          {response.patterns.significantPatterns && response.patterns.significantPatterns.length > 0 && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Significant Patterns
              </Typography>
              <ul>
                {response.patterns.significantPatterns.map((pattern, index) => (
                  <li key={index}>
                    <Typography paragraph>
                      {pattern.description}
                      {pattern.importance === 'high' && (
                        <Chip 
                          size="small" 
                          color="error" 
                          label="High Importance" 
                          sx={{ ml: 1 }} 
                        />
                      )}
                    </Typography>
                  </li>
                ))}
              </ul>
            </>
          )}
          
          {response.patterns.anomalies && response.patterns.anomalies.length > 0 && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Anomalies
              </Typography>
              <ul>
                {response.patterns.anomalies.map((anomaly, index) => (
                  <li key={index}>
                    <Typography paragraph>
                      {anomaly.description}
                    </Typography>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Paper>
      </Box>
    );
  };
  
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
      <Typography variant="h4" gutterBottom>
        NYC Buildings Data AI Assistant
      </Typography>
      
      <Typography variant="body1" paragraph>
        Ask questions about NYC Department of Buildings data in plain language. 
        Get insights about buildings, violations, permits, and more.
      </Typography>
      
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Ask a question about NYC buildings data"
            variant="outlined"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
            placeholder="e.g., Show me buildings in Brooklyn with a high risk of structural issues"
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={isLoading || !query.trim()}
              startIcon={isLoading ? <CircularProgress size={20} /> : <SendIcon />}
            >
              {isLoading ? 'Processing...' : 'Submit'}
            </Button>
            
            <Box>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleReset}
                startIcon={<RefreshIcon />}
                sx={{ ml: 1 }}
                disabled={isLoading}
              >
                New Question
              </Button>
              
              {user && user.id && (
                <Button
                  variant="outlined"
                  color="info"
                  onClick={() => setShowHistory(!showHistory)}
                  startIcon={<HistoryIcon />}
                  sx={{ ml: 1 }}
                  disabled={isLoading}
                >
                  {showHistory ? 'Hide History' : 'Show History'}
                </Button>
              )}
            </Box>
          </Box>
        </form>
        
        {/* Example queries */}
        <Box mt={3}>
          <Typography variant="subtitle2" gutterBottom>
            Example questions you can ask:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {exampleQueries.map((exampleQuery, index) => (
              <Chip
                key={index}
                label={exampleQuery}
                onClick={() => handleExampleClick(exampleQuery)}
                clickable
                color="primary"
                variant="outlined"
                sx={{ mb: 1 }}
              />
            ))}
          </Box>
        </Box>
        
        {/* Conversation history */}
        {user && user.id && (
          <Collapse in={showHistory}>
            <Box mt={3}>
              <Typography variant="subtitle2" gutterBottom>
                Your conversation history:
              </Typography>
              {conversationHistory.length === 0 ? (
                <Typography color="textSecondary">
                  No previous conversations found.
                </Typography>
              ) : (
                <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                  {conversationHistory.map((conversation) => (
                    <Chip
                      key={conversation.conversationId}
                      label={conversation.lastQuery || `Conversation ${conversation.conversationId}`}
                      onClick={() => handleHistoryClick(conversation.conversationId)}
                      clickable
                      color="secondary"
                      variant="outlined"
                      sx={{ mb: 1, mr: 1 }}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Collapse>
        )}
      </Paper>
      
      {/* Error message */}
      {error && (
        <Paper elevation={3} sx={{ p: 3, mb: 4, bgcolor: '#ffebee' }}>
          <Typography color="error" variant="h6">
            Error
          </Typography>
          <Typography color="error">
            {error}
          </Typography>
        </Paper>
      )}
      
      {/* Results */}
      {response && (
        <Box ref={resultsRef}>
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Results
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Summary */}
            <Typography variant="h6" gutterBottom>
              Summary
            </Typography>
            <Typography paragraph>
              {response.insights?.summary || 'No summary available.'}
            </Typography>
            
            {/* Key Findings */}
            {renderKeyFindings()}
            
            {/* Visualizations */}
            {renderVisualizations()}
            
            {/* Patterns and Anomalies */}
            {renderPatterns()}
            
            {/* Recommendations */}
            {renderRecommendations()}
            
            {/* Follow-up prompt */}
            <Box mt={4}>
              <Typography variant="subtitle1" gutterBottom>
                Ask a follow-up question:
              </Typography>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="e.g., Can you focus on residential buildings only?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={isLoading}
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={isLoading || !query.trim()}
                startIcon={isLoading ? <CircularProgress size={20} /> : <SendIcon />}
              >
                {isLoading ? 'Processing...' : 'Submit Follow-up'}
              </Button><response clipped><NOTE>To save on context only part of this file has been shown to you. You should retry this tool after you have searched inside the file with `grep -n` in order to find the line numbers of what you are looking for.</NOTE>