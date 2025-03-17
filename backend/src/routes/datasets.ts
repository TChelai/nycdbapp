import { Router } from 'express';
import { getAllDatasets, getDatasetMetadata, queryDataset, getAggregatedData } from '../controllers/datasets';

const router = Router();

// Get all datasets
router.get('/', getAllDatasets);

// Get metadata for a specific dataset
router.get('/:id', getDatasetMetadata);

// Query data from a specific dataset
router.get('/:id/data', queryDataset);

// Get aggregated data for visualizations
router.get('/:id/aggregate', getAggregatedData);

export default router;
