import express from 'express';
import { getTrains, getTrainById } from '../controllers/trainController.js';

const router = express.Router();

router.get('/', getTrains);
router.get('/:id', getTrainById);

export default router;
