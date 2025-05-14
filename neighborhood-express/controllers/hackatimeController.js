import PQueue from 'p-queue';
import cron from 'node-cron';
import crypto from 'crypto';
import { getHackatimeProjects, updateProjectTotalTime, getPostsForHackatimeSync, updatePostHackatimeTime } from '../utils/airtable.js';

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
  const nextMinutes = Math.ceil(minutes / 30) * 30;
  const nextTime = new Date(now);
  nextTime.setMinutes(nextMinutes, 0, 0);
  
  // If we've passed the time, add 30 minutes
  if (nextTime <= now) {
    nextTime.setMinutes(nextTime.getMinutes() + 30);
  }
  
  return nextTime;
}

// Function to fetch Hackatime data for a single user
async function fetchHackatimeData(slackId, start_date = '2025-04-30', end_date = null) {
  try {
    // First fetch without end date
    const urlWithoutEnd = new URL('https://hackatime.hackclub.com/api/v1/users/' + slackId + '/stats');
    urlWithoutEnd.searchParams.append('features', 'projects');
    urlWithoutEnd.searchParams.append('start_date', start_date);

    const responseWithoutEnd = await fetch(urlWithoutEnd.toString(), {
      headers: {
        Accept: "application/json",
      },
    });

    if (!responseWithoutEnd.ok) {
      throw new Error(`Hackatime API responded with status: ${responseWithoutEnd.status}`);
    }

    const dataWithoutEnd = await responseWithoutEnd.json();

    // Then fetch with end date if provided
    let dataWithEnd = null;
    if (end_date) {
      const urlWithEnd = new URL('https://hackatime.hackclub.com/api/v1/users/' + slackId + '/stats');
      urlWithEnd.searchParams.append('features', 'projects');
      urlWithEnd.searchParams.append('start_date', start_date);
      urlWithEnd.searchParams.append('end_date', end_date);

      const responseWithEnd = await fetch(urlWithEnd.toString(), {
        headers: {
          Accept: "application/json",
        },
      });

      if (!responseWithEnd.ok) {
        throw new Error(`Hackatime API responded with status: ${responseWithEnd.status}`);
      }

      dataWithEnd = await responseWithEnd.json();

      // Log comparison
      log(`Hackatime data comparison for ${slackId} from ${start_date} ${end_date ? 'to ' + end_date : ''}:`);
      log('Without end date - Projects:', dataWithoutEnd.data?.projects?.map(p => ({ name: p.name, time: p.total_seconds })));
      log('With end date - Projects:', dataWithEnd.data?.projects?.map(p => ({ name: p.name, time: p.total_seconds })));
    }

    return end_date ? dataWithEnd : dataWithoutEnd;
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
    
    // Create a map of project IDs to their names and a map of normalized names to original names
    const projectIdToName = new Map();
    const normalizedNameMap = new Map();
    const projectTimeMap = new Map(); // Track raw hackatime data per project
    for (const project of projects) {
      if (project.fields.name) {
        projectIdToName.set(project.id, project.fields.name);
        // Store both original and lowercase version for fuzzy matching
        const normalizedName = project.fields.name.toLowerCase().trim();
        normalizedNameMap.set(normalizedName, project.fields.name);
        // Initialize with an empty map to store time per slackId
        projectTimeMap.set(project.id, new Map());
      }
    }
    
    // Get all posts that need hackatime updates
    const posts = await getPostsForHackatimeSync();

    // Process each post directly
    for (const post of posts) {
      // Add task to queue
      await queue.add(async () => {
        if (!post.fields.lastPost || !post.fields.createdAt || !post.fields.slackId || !post.fields.hackatimeProjects) {
          log(`Skipping post ${post.id} - missing required fields`);
          return;
        }

        // Get all slackIds and process each one
        let slackIds = [];
        if (typeof post.fields.slackId === 'string') {
          slackIds = post.fields.slackId.split(',').map(id => id.trim());
        } else if (Array.isArray(post.fields.slackId)) {
          slackIds = post.fields.slackId;
        } else {
          log(`Invalid slackId format for post ${post.id}: ${typeof post.fields.slackId}`);
          return;
        }

        // Convert project IDs to names
        const postProjectIds = Array.isArray(post.fields.hackatimeProjects) ? post.fields.hackatimeProjects : [];
        const postProjectNames = postProjectIds
          .map(id => projectIdToName.get(id))
          .filter(name => name !== undefined); // Filter out any IDs that don't have corresponding names

        if (postProjectNames.length === 0) {
          log(`No valid project names found for post ${post.id}`);
          return;
        }
        log(`Found ${postProjectNames.length} projects for post ${post.id}: ${postProjectNames.join(', ')}`);

        // Handle dates correctly - lastPost is start_date, createdAt is end_date
        const start_date = new Date(post.fields.lastPost).toISOString().split('T')[0];
        const end_date = new Date(post.fields.createdAt).toISOString().split('T')[0];
        
        // Initialize total time for this post
        let totalSeconds = 0;

        // Process each slackId
        for (const slackId of slackIds) {
          log(`Processing slackId ${slackId} for post ${post.id}`);
          
          // Get hackatime data for this time period
          const postHackatimeData = await fetchHackatimeData(slackId, start_date, end_date);
          
          if (!postHackatimeData?.data?.projects) {
            log(`No hackatime data found for slackId ${slackId}`);
            continue;
          }

          // Process each hackatime project
          for (const hackatimeProject of postHackatimeData.data.projects) {
            const normalizedHackatimeName = hackatimeProject.name.toLowerCase().trim();
            
            // Check if this project matches any of our post's projects
            const matchingProjectName = postProjectNames.find(name => 
              name.toLowerCase().trim() === normalizedHackatimeName ||
              normalizedNameMap.has(normalizedHackatimeName)
            );

            if (matchingProjectName) {
              totalSeconds += hackatimeProject.total_seconds;
              // Store raw hackatime data per project per slackId
              const projectId = postProjectIds[postProjectNames.indexOf(matchingProjectName)];
              const projectSlackTimes = projectTimeMap.get(projectId);
              // Update time for this slackId, taking the maximum value seen
              const currentTime = projectSlackTimes.get(slackId) || 0;
              if (hackatimeProject.total_seconds > currentTime) {
                projectSlackTimes.set(slackId, hackatimeProject.total_seconds);
                log(`Updated time for project "${matchingProjectName}" (${projectId}) slackId ${slackId}: ${hackatimeProject.total_seconds} seconds`);
              }
            } else {
              log(`Skipping project "${hackatimeProject.name}" - not attributed to this post`);
            }
          }
        }

        // Update post's hackatime time
        if (totalSeconds > 0) {
          log(`Updating post ${post.id} with total time: ${totalSeconds} seconds (${(totalSeconds/3600).toFixed(2)} hours)`);
          await updatePostHackatimeTime(post.id, totalSeconds);
          // Add delay after Airtable operation
          await new Promise(resolve => setTimeout(resolve, 500));
        } else {
          log(`No time to update for post ${post.id}`);
        }
      });
    }

    // Wait for all tasks to complete
    await queue.onIdle();
    
    // Update project times - sum up time across all slackIds for each project
    for (const [projectId, slackTimes] of projectTimeMap.entries()) {
      const totalSeconds = Array.from(slackTimes.values()).reduce((sum, time) => sum + time, 0);
      if (totalSeconds > 0) {
        log(`Updating project ${projectId} (${projectIdToName.get(projectId)}) with total time:`, {
          totalSeconds,
          hoursFormatted: (totalSeconds/3600).toFixed(2),
          breakdownBySlackId: Object.fromEntries(slackTimes.entries())
        });
        await updateProjectTotalTime(projectId, totalSeconds);
        // Add delay after Airtable operation
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
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
    log(`Next sync scheduled for: ${nextSyncTime.toISOString()}`);

    // Set up cron job for syncs - run every 30 minutes
    cronJob = cron.schedule('*/30 * * * *', async () => {
      log('Cron job triggered');
      await syncHackatimeData();
    });
    
    // Verify cron job is set up
    if (!cronJob) {
      throw new Error('Failed to initialize cron job');
    }
    log('Cron job successfully initialized - running every 30 minutes');
    
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