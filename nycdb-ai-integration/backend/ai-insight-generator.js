/**
 * AI Insight Generator Service for NYCDB AI Integration
 * 
 * This service uses advanced AI models to generate insights from the analyzed data,
 * providing explanations, identifying patterns, and creating narrative summaries.
 */

const { Configuration, OpenAIApi } = require('openai');
const dotenv = require('dotenv');

dotenv.config();

// Initialize OpenAI client
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

/**
 * Generate narrative insights from analysis results
 * @param {Object} structuredQuery - The structured query from NLP service
 * @param {Object} analysisResults - Results from data analysis
 * @returns {Object} Narrative insights
 */
async function generateNarrativeInsights(structuredQuery, analysisResults) {
  try {
    // Prepare the prompt for the language model
    const prompt = prepareInsightPrompt(structuredQuery, analysisResults);
    
    // Call the language model to generate insights
    const completion = await openai.createCompletion({
      model: "gpt-3.5-turbo-instruct",
      prompt: prompt,
      max_tokens: 800,
      temperature: 0.7,
    });

    // Parse the response
    const insights = completion.data.choices[0].text.trim();
    
    // Extract key findings and explanations
    const keyFindings = extractKeyFindings(insights);
    const explanations = extractExplanations(insights);
    
    return {
      summary: insights,
      keyFindings,
      explanations,
      confidence: 0.85 // Placeholder for a real confidence score
    };
  } catch (error) {
    console.error('Error generating narrative insights:', error);
    return {
      summary: "Unable to generate insights due to an error.",
      keyFindings: [],
      explanations: [],
      confidence: 0
    };
  }
}

/**
 * Generate explanations for specific patterns or anomalies in the data
 * @param {Object} analysisResults - Results from data analysis
 * @param {string} pattern - The pattern or anomaly to explain
 * @returns {Object} Explanation
 */
async function generateExplanation(analysisResults, pattern) {
  try {
    // Prepare the prompt for the language model
    const prompt = `
You are an expert analyst of NYC Department of Buildings data. Based on the following analysis results, 
provide a detailed explanation for the following pattern or anomaly:

Pattern to explain: "${pattern}"

Analysis Results: ${JSON.stringify(analysisResults, null, 2).substring(0, 1500)}

Provide a concise explanation that considers:
1. Possible causes of this pattern
2. Contextual factors that might contribute
3. Historical precedents if relevant
4. Potential implications

Your explanation should be informative, factual, and avoid speculation beyond what the data supports.
`;
    
    // Call the language model to generate explanation
    const completion = await openai.createCompletion({
      model: "gpt-3.5-turbo-instruct",
      prompt: prompt,
      max_tokens: 500,
      temperature: 0.5,
    });

    // Parse the response
    const explanation = completion.data.choices[0].text.trim();
    
    return {
      pattern,
      explanation,
      confidence: 0.8 // Placeholder for a real confidence score
    };
  } catch (error) {
    console.error('Error generating explanation:', error);
    return {
      pattern,
      explanation: "Unable to generate an explanation due to an error.",
      confidence: 0
    };
  }
}

/**
 * Generate recommendations based on analysis results
 * @param {Object} structuredQuery - The structured query from NLP service
 * @param {Object} analysisResults - Results from data analysis
 * @returns {Array} Recommendations
 */
async function generateRecommendations(structuredQuery, analysisResults) {
  try {
    // Prepare the prompt for the language model
    const prompt = `
You are an expert analyst of NYC Department of Buildings data. Based on the following query and analysis results, 
provide actionable recommendations.

User Query: "${structuredQuery.originalQuery}"

Query Type: ${structuredQuery.queryType}

Analysis Results: ${JSON.stringify(analysisResults, null, 2).substring(0, 1500)}

Provide 3-5 specific, actionable recommendations based on this data. Each recommendation should:
1. Be clearly stated
2. Be directly related to the data and analysis
3. Include a brief rationale
4. Be practical and implementable

Format each recommendation as: "Recommendation: [action] - [brief rationale]"
`;
    
    // Call the language model to generate recommendations
    const completion = await openai.createCompletion({
      model: "gpt-3.5-turbo-instruct",
      prompt: prompt,
      max_tokens: 600,
      temperature: 0.6,
    });

    // Parse the response
    const recommendationsText = completion.data.choices[0].text.trim();
    
    // Extract individual recommendations
    const recommendations = recommendationsText
      .split(/\n+/)
      .filter(line => line.includes('Recommendation:') || line.match(/^\d+\.\s+/))
      .map(line => {
        // Clean up the recommendation text
        return line.replace(/^(\d+\.\s+)?Recommendation:\s+/, '').trim();
      })
      .filter(Boolean);
    
    return recommendations;
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return [
      "Unable to generate recommendations due to an error."
    ];
  }
}

/**
 * Identify key insights from time series data
 * @param {Array} timeSeriesData - Time series data
 * @returns {Array} Key insights
 */
function identifyTimeSeriesInsights(timeSeriesData) {
  const insights = [];
  
  if (!timeSeriesData || timeSeriesData.length < 2) {
    return insights;
  }
  
  // Sort data by time
  const sortedData = [...timeSeriesData].sort((a, b) => {
    return new Date(a.time_period || a.date) - new Date(b.time_period || b.date);
  });
  
  // Calculate overall trend
  const firstValue = sortedData[0].count || sortedData[0].value;
  const lastValue = sortedData[sortedData.length - 1].count || sortedData[sortedData.length - 1].value;
  const percentChange = ((lastValue - firstValue) / firstValue * 100).toFixed(1);
  
  if (Math.abs(percentChange) >= 10) {
    insights.push({
      type: 'trend',
      insight: `Overall ${percentChange >= 0 ? 'increase' : 'decrease'} of ${Math.abs(percentChange)}% over the entire period.`,
      importance: 'high'
    });
  }
  
  // Identify significant changes between consecutive periods
  for (let i = 1; i < sortedData.length; i++) {
    const prevValue = sortedData[i-1].count || sortedData[i-1].value;
    const currValue = sortedData[i].count || sortedData[i].value;
    
    if (prevValue === 0) continue;
    
    const change = ((currValue - prevValue) / prevValue * 100).toFixed(1);
    
    if (Math.abs(change) >= 30) {
      const date = new Date(sortedData[i].time_period || sortedData[i].date).toLocaleDateString();
      insights.push({
        type: 'spike',
        insight: `Significant ${change >= 0 ? 'increase' : 'decrease'} of ${Math.abs(change)}% on ${date}.`,
        importance: 'medium',
        date: sortedData[i].time_period || sortedData[i].date
      });
    }
  }
  
  // Check for seasonality (very basic)
  if (sortedData.length >= 24) { // Need at least 2 years of data
    const monthlyAverages = Array(12).fill(0);
    const monthCounts = Array(12).fill(0);
    
    sortedData.forEach(item => {
      const date = new Date(item.time_period || item.date);
      const month = date.getMonth();
      monthlyAverages[month] += (item.count || item.value);
      monthCounts[month]++;
    });
    
    for (let i = 0; i < 12; i++) {
      if (monthCounts[i] > 0) {
        monthlyAverages[i] /= monthCounts[i];
      }
    }
    
    const avgValue = monthlyAverages.reduce((sum, val) => sum + val, 0) / monthlyAverages.filter(v => v > 0).length;
    
    // Find months with significant deviation from average
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    monthlyAverages.forEach((value, month) => {
      if (value === 0) return;
      
      const deviation = ((value - avgValue) / avgValue * 100).toFixed(1);
      
      if (Math.abs(deviation) >= 20) {
        insights.push({
          type: 'seasonality',
          insight: `${monthNames[month]} typically shows a ${deviation >= 0 ? 'higher' : 'lower'} than average value (${Math.abs(deviation)}% ${deviation >= 0 ? 'above' : 'below'} average).`,
          importance: 'low',
          month
        });
      }
    });
  }
  
  return insights;
}

/**
 * Identify correlations between different metrics
 * @param {Object} data - Data with multiple metrics
 * @returns {Array} Correlations
 */
function identifyCorrelations(data) {
  const correlations = [];
  
  if (!data || !Array.isArray(data) || data.length < 5) {
    return correlations;
  }
  
  // Get numerical columns
  const numericalColumns = [];
  const firstRow = data[0];
  
  Object.keys(firstRow).forEach(key => {
    if (typeof firstRow[key] === 'number') {
      numericalColumns.push(key);
    }
  });
  
  // Need at least 2 numerical columns to find correlations
  if (numericalColumns.length < 2) {
    return correlations;
  }
  
  // Calculate correlations between all pairs of numerical columns
  for (let i = 0; i < numericalColumns.length; i++) {
    for (let j = i + 1; j < numericalColumns.length; j++) {
      const col1 = numericalColumns[i];
      const col2 = numericalColumns[j];
      
      const correlation = calculatePearsonCorrelation(
        data.map(row => row[col1]),
        data.map(row => row[col2])
      );
      
      if (Math.abs(correlation) >= 0.5) { // Only include moderate to strong correlations
        correlations.push({
          metrics: [col1, col2],
          correlation: correlation.toFixed(2),
          strength: getCorrelationStrength(correlation),
          direction: correlation > 0 ? 'positive' : 'negative'
        });
      }
    }
  }
  
  return correlations;
}

/**
 * Calculate Pearson correlation coefficient between two arrays
 * @param {Array} x - First array of values
 * @param {Array} y - Second array of values
 * @returns {number} Correlation coefficient
 */
function calculatePearsonCorrelation(x, y) {
  const n = x.length;
  
  // Calculate means
  const meanX = x.reduce((sum, val) => sum + val, 0) / n;
  const meanY = y.reduce((sum, val) => sum + val, 0) / n;
  
  // Calculate covariance and standard deviations
  let covariance = 0;
  let varX = 0;
  let varY = 0;
  
  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    
    covariance += diffX * diffY;
    varX += diffX * diffX;
    varY += diffY * diffY;
  }
  
  // Avoid division by zero
  if (varX === 0 || varY === 0) {
    return 0;
  }
  
  return covariance / (Math.sqrt(varX) * Math.sqrt(varY));
}

/**
 * Get correlation strength description
 * @param {number} correlation - Correlation coefficient
 * @returns {string} Correlation strength
 */
function getCorrelationStrength(correlation) {
  const absCorrelation = Math.abs(correlation);
  
  if (absCorrelation >= 0.8) return 'very strong';
  if (absCorrelation >= 0.6) return 'strong';
  if (absCorrelation >= 0.4) return 'moderate';
  if (absCorrelation >= 0.2) return 'weak';
  return 'very weak';
}

/**
 * Prepare prompt for generating insights
 * @param {Object} structuredQuery - The structured query
 * @param {Object} analysisResults - Analysis results
 * @returns {string} Formatted prompt
 */
function prepareInsightPrompt(structuredQuery, analysisResults) {
  // Base prompt with context about the query and data
  let prompt = `
You are an expert analyst of NYC Department of Buildings data. Based on the following query and analysis results, 
provide insightful observations about the data. Focus on patterns, trends, and notable findings.

User Query: "${structuredQuery.originalQuery}"

Query Type: ${structuredQuery.queryType}

Analysis Results: ${JSON.stringify(analysisResults, null, 2).substring(0, 1500)}

Provide a concise summary of key insights, including:
1. Most significant findings
2. Patterns or trends identified
3. Possible explanations for these patterns
4. Any recommendations or next steps for further investigation

Your response should be informative, factual, and avoid speculation beyond what the data supports.
`;

  return prompt;
}

/**
 * Extract key findings from generated insights
 * @param {string} insights - Generated insights text
 * @returns {Array} List of key findings
 */
function extractKeyFindings(insights) {
  // Simple extraction based on common patterns
  const findingsMatch = insights.match(/key findings:?([\s\S]*?)(?:\n\n|$)/i);
  if (findingsMatch && findingsMatch[1]) {
    return findingsMatch[1]
      .split(/\n-|\n\d+\./)
      .map(item => item.trim())
      .filter(Boolean);
  }
  
  // Fallback: look for sentences that seem like findings
  const sentences = insights.split(/\.\s+/);
  return sentences
    .filter(sentence => 
      sentence.includes('significant') || 
      sentence.includes('notable') || 
      sentence.includes('important') ||
      sentence.includes('found that')
    )
    .map(sentence => sentence.trim() + '.');
}

/**
 * Extract explanations from generated insights
 * @param {string} insights - Generated insights text
 * @returns {Array} List of explanations
 */
function extractExplanations(insights) {
  // Look for explanation patterns
  const explanationMatches = insights.match(/(?:because|due to|explained by|result of|caused by)([^.]+)/gi);
  
  if (explanationMatches) {
    return explanationMatches.map(match => match.trim());
  }
  
  return [];
}

module.exports = {
  generateNarrativeInsights,
  generateExplanation,
  generateRecommendations,
  identifyTimeSeriesInsights,
  identifyCorrelations
};
