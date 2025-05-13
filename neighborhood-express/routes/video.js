import express from 'express';
import { uploadVideo, uploadIcon, uploadImages, uploadScreenshot } from '../controllers/videoController.js';

const router = express.Router();

router.post('/upload-video', uploadVideo);
router.post('/upload-icon', uploadIcon);
router.post('/upload-images', uploadImages);
router.post('/upload-screenshot', uploadScreenshot);

export default router; 