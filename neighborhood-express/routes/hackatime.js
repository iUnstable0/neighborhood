import express from 'express';
import { syncHackatimeData, getNextSyncTime, triggerManualSync } from '../controllers/hackatimeController.js';

const router = express.Router();

// Get current sync status
router.get('/status', (req, res) => {
  const nextSync = getNextSyncTime();
  if (!nextSync) {
    return res.json({ error: 'Sync not initialized' });
  }
  
  const now = new Date();
  const timeLeft = nextSync - now;
  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  
  res.json({
    nextSync: nextSync.toISOString(),
    timeLeft: {
      minutes,
      seconds
    }
  });
});

// Manual trigger for Hackatime sync
router.post('/sync', async (req, res) => {
  try {
    const success = await triggerManualSync();
    if (success) {
      res.json({ 
        message: 'Hackatime sync completed successfully',
        nextSync: getNextSyncTime()?.toISOString()
      });
    } else {
      res.status(500).json({ error: 'Hackatime sync failed' });
    }
  } catch (error) {
    console.error('Error in sync endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 