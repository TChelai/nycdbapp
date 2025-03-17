/**
 * Visualization Components for NYCDB AI Integration
 * 
 * This file contains visualization components used by the AI Query Component
 * to display data insights through charts and tables.
 */

import React from 'react';
import { 
  Box, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper 
} from '@mui/material';
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

/**
 * Line Chart Component
 * @param {Object} props - Component props
 * @param {Array} props.data - Chart data
 * @param {Object} props.config - Chart configuration
 */
export const LineChart = ({ data, config }) => {
  if (!data || data.length === 0) {
    return <Typography color="textSecondary">No data available for chart</Typography>;
  }

  const { labels = {}, xAxisLabel, yAxisLabel } = config || {};
  const { categoryKey = 'date', valueKey = 'value' } = labels || {};

  return (
    <Box sx={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <RechartsLineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey={categoryKey} 
            label={{ value: xAxisLabel, position: 'insideBottomRight', offset: -10 }} 
          />
          <YAxis 
            label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} 
          />
          <Tooltip />
          <Legend />
          <Line 
            type="monotone" 
            dataKey={valueKey} 
            stroke="#8884d8" 
            activeDot={{ r: 8 }} 
            name={valueKey.replace(/_/g, ' ')}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </Box>
  );
};

/**
 * Bar Chart Component
 * @param {Object} props - Component props
 * @param {Array} props.data - Chart data
 * @param {Object} props.config - Chart configuration
 */
export const BarChart = ({ data, config }) => {
  if (!data || data.length === 0) {
    return <Typography color="textSecondary">No data available for chart</Typography>;
  }

  const { labels = {}, xAxisLabel, yAxisLabel, isHorizontal, isGrouped } = config || {};
  const { categoryKey = 'category', valueKey = 'value', valueKeys } = labels || {};

  // For grouped bar charts
  if (isGrouped && valueKeys && valueKeys.length > 0) {
    return (
      <Box sx={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <RechartsBarChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            layout={isHorizontal ? 'vertical' : 'horizontal'}
          >
            <CartesianGrid strokeDasharray="3 3" />
            {isHorizontal ? (
              <>
                <YAxis dataKey={categoryKey} type="category" />
                <XAxis type="number" />
              </>
            ) : (
              <>
                <XAxis dataKey={categoryKey} />
                <YAxis />
              </>
            )}
            <Tooltip />
            <Legend />
            {valueKeys.map((key, index) => (
              <Bar 
                key={key} 
                dataKey={key} 
                fill={COLORS[index % COLORS.length]} 
                name={key.replace(/_/g, ' ')}
              />
            ))}
          </RechartsBarChart>
        </ResponsiveContainer>
      </Box>
    );
  }

  // For simple bar charts
  return (
    <Box sx={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <RechartsBarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          layout={isHorizontal ? 'vertical' : 'horizontal'}
        >
          <CartesianGrid strokeDasharray="3 3" />
          {isHorizontal ? (
            <>
              <YAxis 
                dataKey={categoryKey} 
                type="category" 
                label={{ value: xAxisLabel, position: 'insideLeft' }} 
              />
              <XAxis 
                type="number" 
                label={{ value: yAxisLabel, position: 'insideBottom' }} 
              />
            </>
          ) : (
            <>
              <XAxis 
                dataKey={categoryKey} 
                label={{ value: xAxisLabel, position: 'insideBottomRight', offset: -10 }} 
              />
              <YAxis 
                label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} 
              />
            </>
          )}
          <Tooltip />
          <Legend />
          <Bar 
            dataKey={valueKey} 
            fill="#8884d8" 
            name={valueKey.replace(/_/g, ' ')}
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </Box>
  );
};

/**
 * Pie Chart Component
 * @param {Object} props - Component props
 * @param {Array} props.data - Chart data
 * @param {Object} props.config - Chart configuration
 */
export const PieChart = ({ data, config }) => {
  if (!data || data.length === 0) {
    return <Typography color="textSecondary">No data available for chart</Typography>;
  }

  const { labels = {} } = config || {};
  const { categoryKey = 'category', valueKey = 'value' } = labels || {};

  return (
    <Box sx={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey={valueKey}
            nameKey={categoryKey}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </RechartsPieChart>
      </ResponsiveContainer>
    </Box>
  );
};

/**
 * Data Table Component
 * @param {Object} props - Component props
 * @param {Array} props.data - Table data
 * @param {Object} props.config - Table configuration
 */
export const DataTable = ({ data, config }) => {
  if (!data || data.length === 0) {
    return <Typography color="textSecondary">No data available for table</Typography>;
  }

  const { columns } = config || {};
  
  // If columns are not specified, generate them from the first data item
  const tableColumns = columns || Object.keys(data[0]).map(key => ({
    key,
    label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }));

  return (
    <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
      <Table stickyHeader aria-label="data table" size="small">
        <TableHead>
          <TableRow>
            {tableColumns.map((column) => (
              <TableCell key={column.key}>
                <Typography variant="subtitle2">{column.label}</Typography>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={rowIndex} hover>
              {tableColumns.map((column) => (
                <TableCell key={`${rowIndex}-${column.key}`}>
                  {row[column.key] !== undefined ? String(row[column.key]) : ''}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
