import PQueue from 'p-queue';
import cron from 'node-cron';
import crypto from 'crypto';
import { getHackatimeProjects, updateProjectTotalTime } from '../utils/airtable.js';

// Create a queue with rate limiting
const queue = new PQueue({ concurrency: 2 }); // Process 2 requests at a time

// Track last and next sync times
let lastSyncTime = null;
let nextSyncTime = null;
let cronJob = null;
let countdownInterval = null;

function log(message, data = null) {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}][Hackatime] ${message}`, data);
  } else {
    console.log(`[${timestamp}][Hackatime] ${message}`);
  }
}

function logError(message, error) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}][Hackatime] ${message}`, error);
}

// Function to display time until next sync
function displayNextSyncTime() {
  if (!nextSyncTime) {
    log('Warning: Next sync time not set');
    return;
  }
  
  const now = new Date();
  const timeLeft = nextSyncTime - now;
  
  if (timeLeft > 0) {
    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);
    log(`Time until next sync: ${minutes}m ${seconds}s`);
  } else {
    log('Sync should be starting soon...');
  }
}

// Function to calculate next sync time
function calculateNextSyncTime() {
  const now = new Date();
  const minutes = now.getMinutes();
  const nextMinutes = Math.ceil(minutes / 15) * 15;
  const nextTime = new Date(now);
  nextTime.setMinutes(nextMinutes, 0, 0);
  
  // If we've passed the time, add 15 minutes
  if (nextTime <= now) {
    nextTime.setMinutes(nextTime.getMinutes() + 15);
  }
  
  return nextTime;
}

// Function to fetch Hackatime data for a single user
async function fetchHackatimeData(slackId) {
  try {
    const response = await fetch(
      `https://hackatime.hackclub.com/api/v1/users/${slackId}/stats?features=projects&start_date=2025-04-30`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Hackatime API responded with status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    logError(`Error fetching Hackatime data for ${slackId}:`, error);
    return null;
  }
}

// Main function to sync Hackatime data
export async function syncHackatimeData() {
  try {
    log('Starting Hackatime data sync...');
    // Get all projects with slackIds
    const projects = await getHackatimeProjects();

    // Group projects by slackId to avoid duplicate API calls
    const projectsBySlackId = projects.reduce((acc, project) => {
      if (project.fields.slackId) {
        if (!acc[project.fields.slackId]) {
          acc[project.fields.slackId] = [];
        }
        acc[project.fields.slackId].push({
          id: project.id,
          name: project.fields.name
        });
      }
      return acc;
    }, {});

    // Process each slackId
    for (const [slackId, projectsForUser] of Object.entries(projectsBySlackId)) {
      // Add task to queue
      await queue.add(async () => {
        const hackatimeData = await fetchHackatimeData(slackId);
        
        if (!hackatimeData || !hackatimeData.data || !hackatimeData.data.projects) {
          return;
        }

        // Create a map of project names to total seconds
        const projectTimeMap = new Map(
          hackatimeData.data.projects.map(p => [p.name, p.total_seconds])
        );

        // Update each project's total time
        for (const project of projectsForUser) {
          if (projectTimeMap.has(project.name)) {
            await updateProjectTotalTime(project.id, projectTimeMap.get(project.name));
          }
        }
      });
    }

    // Wait for all tasks to complete
    await queue.onIdle();
    
    // Update sync timing
    lastSyncTime = new Date();
    nextSyncTime = calculateNextSyncTime();
    
    log('Hackatime data sync completed successfully');
    log(`Next sync scheduled for: ${nextSyncTime.toISOString()}`);
    
    return true;
  } catch (error) {
    logError('Error in Hackatime sync:', error);
    return false;
  }
}

// Initialize the cron job
export async function initHackatimeSync() {
  try {
    // Clean up any existing intervals/jobs
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }
    if (cronJob) {
      cronJob.stop();
    }

    // Set initial next sync time
    nextSyncTime = calculateNextSyncTime();
    log(`Initializing Hackatime sync. First sync scheduled for: ${nextSyncTime.toISOString()}`);

    // Set up cron job for syncs
    cronJob = cron.schedule('*/15 * * * *', async () => {
      log('Cron job triggered');
      await syncHackatimeData();
    });
    
    // Verify cron job is set up
    if (!cronJob) {
      throw new Error('Failed to initialize cron job');
    }
    log('Cron job successfully initialized');
    
    // Set up timer display with immediate first display
    displayNextSyncTime();
    countdownInterval = setInterval(() => {
      displayNextSyncTime();
    }, 60000); // Display every minute
    
    // Verify countdown is working
    if (!countdownInterval) {
      throw new Error('Failed to initialize countdown');
    }
    log('Countdown timer successfully initialized');
    
    log('Hackatime sync system fully initialized');
  } catch (error) {
    logError('Error initializing Hackatime sync:', error);
    throw error; // Re-throw to make sure the error is noticed
  }
}

// Export for testing/manual triggering
export function getNextSyncTime() {
  return nextSyncTime;
}

// Add a manual trigger function for testing
export async function triggerManualSync() {
  log('Manual sync triggered');
  return await syncHackatimeData();
} 