import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { classifyBatch, createOverride } from '../services/classification.service.js';
import { ClassifyBatchSchema, CreateOverrideSchema } from '@textile-inspector/shared';

const router = express.Router();

router.use(authenticate);

router.post('/apply', async (req, res, next) => {
  try {
    // NOTE: This endpoint uses the old color-based classification service
    // which requires color_taxonomy table and acceptable_color_id column.
    // These were removed in migration 004. This endpoint is deprecated.
    // Use /api/inspection/classify-and-save instead for YOLO-based classification.
    return res.status(410).json({ 
      error: 'This endpoint is deprecated. Use /api/inspection/classify-and-save for YOLO-based classification.' 
    });
    
    // Old code (commented out):
    // const { batchId } = ClassifyBatchSchema.parse(req.body);
    // const result = await classifyBatch(batchId);
    // res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/override', async (req, res, next) => {
  try {
    const { imageId, newClassification, reason } = CreateOverrideSchema.parse(req.body);
    await createOverride(imageId, req.user.userId, newClassification, reason);
    res.json({ message: 'Override created' });
  } catch (error) {
    next(error);
  }
});

export default router;
