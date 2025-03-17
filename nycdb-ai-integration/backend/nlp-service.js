/**
 * Natural Language Processing Service for NYCDB AI Integration
 * 
 * This service handles the interpretation of natural language queries about NYC DOB data,
 * extracting intents, entities, and parameters to convert them into structured database queries.
 */

const { Configuration, OpenAIApi } = require('openai');
const dotenv = require('dotenv');

dotenv.config();

// Initialize OpenAI client
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Define query types and their corresponding parameters
const QUERY_TYPES = {
  RISK_ASSESSMENT: 'risk_assessment',
  TREND_ANALYSIS: 'trend_analysis',
  VIOLATION_SEARCH: 'violation_search',
  BUILDING_LOOKUP: 'building_lookup',
  COMPARISON: 'comparison',
  GENERAL_STATS: 'general_stats'
};

// Define entity types that can be extracted from queries
const ENTITY_TYPES = {
  LOCATION: 'location',
  BUILDING_TYPE: 'building_type',
  TIME_PERIOD: 'time_period',
  VIOLATION_TYPE: 'violation_type',
  PROPERTY_ATTRIBUTE: 'property_attribute'
};

// NYC boroughs for location entity normalization
const NYC_BOROUGHS = ['manhattan', 'brooklyn', 'queens', 'bronx', 'staten island'];

/**
 * Process a natural language query to extract structured information
 * @param {string} query - The user's natural language query
 * @param {Object} conversationContext - Previous conversation context (optional)
 * @returns {Object} Structured query information
 */
async function processQuery(query, conversationContext = null) {
  try {
    // Prepare the prompt for the language model
    const prompt = preparePrompt(query, conversationContext);
    
    // Call the language model to interpret the query
    const completion = await openai.createCompletion({
      model: "gpt-3.5-turbo-instruct",
      prompt: prompt,
      max_tokens: 500,
      temperature: 0.3,
    });

    // Parse the model's response into structured data
    const structuredQuery = parseModelResponse(completion.data.choices[0].text);
    
    // Validate and normalize the extracted entities
    const validatedQuery = validateAndNormalizeQuery(structuredQuery);
    
    // Update with conversation context if this is a follow-up question
    const finalQuery = incorporateConversationContext(validatedQuery, conversationContext);
    
    return finalQuery;
  } catch (error) {
    console.error('Error processing natural language query:', error);
    throw new Error('Failed to process natural language query');
  }
}

/**
 * Prepare the prompt for the language model
 * @param {string} query - The user's query
 * @param {Object} context - Previous conversation context
 * @returns {string} Formatted prompt
 */
function preparePrompt(query, context) {
  let prompt = `
You are an AI assistant specialized in analyzing NYC Department of Buildings (DOB) data.
Extract the following information from this user query about NYC buildings:

1. Query Type (one of: risk_assessment, trend_analysis, violation_search, building_lookup, comparison, general_stats)
2. Entities (locations, building types, time periods, violation types, property attributes)
3. Filters (any specific conditions to apply)
4. Aggregations (how to group or summarize data)
5. Sort Order (how to order results)
6. Limit (any limit on the number of results)

User Query: "${query}"

Respond in JSON format:
`;

  // Add conversation context if available
  if (context && context.previousQueries && context.previousQueries.length > 0) {
    prompt += `\nThis is a follow-up to previous conversation. Previous context: ${JSON.stringify(context.previousQueries.slice(-2))}`;
  }

  return prompt;
}

/**
 * Parse the language model's response into structured data
 * @param {string} response - The raw model response
 * @returns {Object} Structured query information
 */
function parseModelResponse(response) {
  try {
    // Extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from model response');
    }
    
    const parsedResponse = JSON.parse(jsonMatch[0]);
    
    return {
      queryType: parsedResponse.queryType || null,
      entities: parsedResponse.entities || {},
      filters: parsedResponse.filters || [],
      aggregations: parsedResponse.aggregations || [],
      sortOrder: parsedResponse.sortOrder || null,
      limit: parsedResponse.limit || 100,
      originalQuery: parsedResponse.originalQuery
    };
  } catch (error) {
    console.error('Error parsing model response:', error);
    // Return a minimal structure if parsing fails
    return {
      queryType: null,
      entities: {},
      filters: [],
      aggregations: [],
      sortOrder: null,
      limit: 100,
      originalQuery: response
    };
  }
}

/**
 * Validate and normalize the extracted entities
 * @param {Object} query - The structured query
 * @returns {Object} Validated and normalized query
 */
function validateAndNormalizeQuery(query) {
  const normalizedQuery = { ...query };
  
  // Normalize locations (e.g., borough names)
  if (normalizedQuery.entities.locations) {
    normalizedQuery.entities.locations = normalizedQuery.entities.locations.map(location => {
      // Check if the location is a borough and normalize it
      const boroughMatch = NYC_BOROUGHS.find(borough => 
        location.toLowerCase().includes(borough)
      );
      
      if (boroughMatch) {
        return boroughMatch.charAt(0).toUpperCase() + boroughMatch.slice(1);
      }
      
      return location;
    });
  }
  
  // Normalize time periods
  if (normalizedQuery.entities.timePeriods) {
    normalizedQuery.entities.timePeriods = normalizedQuery.entities.timePeriods.map(period => {
      // Convert relative time periods to absolute dates
      if (period.toLowerCase().includes('last year')) {
        const currentYear = new Date().getFullYear();
        return { start: `${currentYear-1}-01-01`, end: `${currentYear-1}-12-31` };
      }
      
      if (period.toLowerCase().includes('past five years')) {
        const currentYear = new Date().getFullYear();
        return { start: `${currentYear-5}-01-01`, end: `${currentYear}-12-31` };
      }
      
      // Return as is if no normalization needed
      return period;
    });
  }
  
  return normalizedQuery;
}

/**
 * Incorporate conversation context for follow-up questions
 * @param {Object} query - The current query
 * @param {Object} context - Previous conversation context
 * @returns {Object} Updated query with context
 */
function incorporateConversationContext(query, context) {
  if (!context || !context.previousQueries || context.previousQueries.length === 0) {
    return query;
  }
  
  const updatedQuery = { ...query };
  const previousQuery = context.previousQueries[context.previousQueries.length - 1];
  
  // If current query has no location but previous did, use the previous location
  if (!updatedQuery.entities.locations && previousQuery.entities.locations) {
    updatedQuery.entities.locations = previousQuery.entities.locations;
  }
  
  // If current query has no building type but previous did, use the previous building type
  if (!updatedQuery.entities.buildingTypes && previousQuery.entities.buildingTypes) {
    updatedQuery.entities.buildingTypes = previousQuery.entities.buildingTypes;
  }
  
  // If this is a refinement query (e.g., "Show me only residential ones")
  if (updatedQuery.queryType === null && previousQuery.queryType) {
    updatedQuery.queryType = previousQuery.queryType;
  }
  
  return updatedQuery;
}

/**
 * Convert the structured query to a database query
 * @param {Object} structuredQuery - The structured query information
 * @returns {Object} Database query parameters
 */
function convertToDatabaseQuery(structuredQuery) {
  // This will be implemented in the data retrieval module
  // but we include a stub here for completeness
  const dbQuery = {
    tables: [],
    columns: [],
    filters: [],
    joins: [],
    groupBy: [],
    orderBy: null,
    limit: structuredQuery.limit
  };
  
  // Determine which tables to query based on query type
  switch (structuredQuery.queryType) {
    case QUERY_TYPES.RISK_ASSESSMENT:
      dbQuery.tables.push('hpd_violations', 'dob_violations', 'pluto');
      break;
    case QUERY_TYPES.TREND_ANALYSIS:
      dbQuery.tables.push('dob_permits');
      break;
    case QUERY_TYPES.VIOLATION_SEARCH:
      dbQuery.tables.push('hpd_violations', 'dob_violations');
      break;
    case QUERY_TYPES.BUILDING_LOOKUP:
      dbQuery.tables.push('pluto');
      break;
    default:
      dbQuery.tables.push('pluto');
  }
  
  // Convert entities to filters
  if (structuredQuery.entities.locations) {
    structuredQuery.entities.locations.forEach(location => {
      dbQuery.filters.push({
        table: 'pluto',
        column: 'borough',
        operator: '=',
        value: location
      });
    });
  }
  
  // Add more conversion logic here...
  
  return dbQuery;
}

module.exports = {
  processQuery,
  convertToDatabaseQuery,
  QUERY_TYPES,
  ENTITY_TYPES
};
