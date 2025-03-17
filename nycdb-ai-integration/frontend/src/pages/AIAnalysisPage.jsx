import React from 'react';
import { Box, Typography, Paper, Divider } from '@mui/material';
import AIQueryComponent from '../components/AIQueryComponent';

/**
 * AI Analysis Page for NYCDB Web App
 * 
 * This page provides access to the AI-powered data analysis feature,
 * allowing users to ask questions in natural language about NYC DOB data.
 */
const AIAnalysisPage = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        AI-Powered Data Analysis
      </Typography>
      
      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          About This Feature
        </Typography>
        <Typography paragraph>
          This feature uses generative AI to analyze NYC Department of Buildings data based on your natural language queries.
          You can ask questions about buildings, violations, permits, and more to get insights, visualizations, and explanations.
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" gutterBottom>
          What You Can Ask:
        </Typography>
        <Typography paragraph>
          • Questions about building risks and violations (e.g., "Show me buildings in Brooklyn with high risk of structural issues")
        </Typography>
        <Typography paragraph>
          • Trend analysis over time (e.g., "Has construction activity increased in Queens over the past five years?")
        </Typography>
        <Typography paragraph>
          • Pattern detection in violations or permits (e.g., "What are the most common violations in Manhattan high-rises?")
        </Typography>
        <Typography paragraph>
          • Geographic comparisons (e.g., "Compare violation rates across different boroughs")
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" gutterBottom>
          How It Works:
        </Typography>
        <Typography paragraph>
          1. Your natural language query is processed to understand what data you're looking for
        </Typography>
        <Typography paragraph>
          2. Relevant data is retrieved from the NYC DOB database
        </Typography>
        <Typography paragraph>
          3. AI analyzes the data to identify patterns, trends, and insights
        </Typography>
        <Typography paragraph>
          4. Results are presented with visualizations and explanations
        </Typography>
        <Typography paragraph>
          5. You can ask follow-up questions to refine your query
        </Typography>
      </Paper>
      
      <AIQueryComponent />
    </Box>
  );
};

export default AIAnalysisPage;
