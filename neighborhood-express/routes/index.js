import express from 'express';
import { uploadVideo, uploadIcon } from '../controllers/videoController.js';

const router = express.Router();

router.post('/upload-video', uploadVideo);
router.post('/upload-icon', uploadIcon);

export default router; 