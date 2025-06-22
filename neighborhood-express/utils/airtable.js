import Airtable from "airtable";

// Helper function for timestamped logs
function log(message, data = null) {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`[${timestamp}][Airtable] ${message}`, data);
  } else {
    console.log(`[${timestamp}][Airtable] ${message}`);
  }
}

function logError(message, error) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}][Airtable] ${message}`, error);
}

// Validate environment variables
if (!process.env.AIRTABLE_API_KEY) {
  throw new Error('AIRTABLE_API_KEY environment variable is not set');
}

if (!process.env.AIRTABLE_BASE_ID) {
  throw new Error('AIRTABLE_BASE_ID environment variable is not set');
}

// Initialize Airtable with explicit configuration
const airtable = new Airtable({
  endpointUrl: 'https://api.airtable.com',
  apiKey: process.env.AIRTABLE_API_KEY
});

const base = airtable.base(process.env.AIRTABLE_BASE_ID);

const USERS_TABLE = "neighbors";
const HACKATIME_PROJECTS_TABLE = "hackatimeProjects";

// Utility function to add delay between API calls
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const tokenRegex = /^[A-Za-z0-9_-]{10,}$/;

export async function checkUser(token) {
  if (!token) return null;

  if (!tokenRegex.test(token)) {
    return null;
  }

  try {
    const records = await base("neighbors")
      .select({
        filterByFormula: `{token} = '${token}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (records && records.length > 0) {
      return true;
    }

    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Get all Hackatime projects with their slackIds
 * @returns {Promise<Array>} Array of projects with their IDs and fields
 */
export async function getHackatimeProjects() {
  try {
    log(`Fetching projects from ${HACKATIME_PROJECTS_TABLE} table...`);
    const records = await base(HACKATIME_PROJECTS_TABLE)
      .select({
        fields: ['name', 'slackId']
      })
      .all();
    
    log(`Found ${records.length} projects`);
    log('Sample projects:', records.slice(0, 3).map(record => ({
      id: record.id,
      name: record.fields.name,
      hasSlackId: !!record.fields.slackId
    })));
    
    return records;
  } catch (error) {
    logError('Error fetching Hackatime projects:', error);
    throw error;
  }
}

/**
 * Update a project's total time in Airtable
 * @param {string} recordId - The Airtable record ID
 * @param {number} totalSeconds - Total time in seconds
 * @returns {Promise<boolean>} Success status
 */
export async function updateProjectTotalTime(recordId, totalSeconds) {
  try {
    log(`Updating project ${recordId} with total time: ${totalSeconds} seconds (${(totalSeconds/3600).toFixed(2)} hours)`);
    
    // First, get the current value to log the change
    const currentRecord = await base(HACKATIME_PROJECTS_TABLE).find(recordId);
    const currentTime = currentRecord.fields.totalTime || 0;
    
    // Update the record
    const updatedRecord = await base(HACKATIME_PROJECTS_TABLE).update(recordId, {
      'totalTime': totalSeconds
    });
    
    log('Successfully updated project:', {
      name: updatedRecord.fields.name,
      previousTime: `${(currentTime/3600).toFixed(2)} hours`,
      newTime: `${(totalSeconds/3600).toFixed(2)} hours`,
      difference: `${((totalSeconds - currentTime)/3600).toFixed(2)} hours`
    });
    
    return true;
  } catch (error) {
    logError(`Error updating project ${recordId}:`, error);
    return false;
  }
}

/**
 * Update a post's hackatime time in Airtable
 * @param {string} recordId - The Airtable record ID
 * @param {number} totalSeconds - Total time in seconds
 * @returns {Promise<boolean>} Success status
 */
export async function updatePostHackatimeTime(recordId, totalSeconds) {
  try {
    log(`Updating post ${recordId} with hackatime time: ${totalSeconds} seconds (${(totalSeconds/3600).toFixed(2)} hours)`);
    
    // First, get the current value to log the change
    const currentRecord = await base('Posts').find(recordId);
    const currentTime = currentRecord.fields.hackatimeTime || 0;
    
    // Update the record
    const updatedRecord = await base('Posts').update(recordId, {
      'hackatimeTime': totalSeconds
    });
    
    log('Successfully updated post:', {
      id: updatedRecord.id,
      previousTime: `${(currentTime/3600).toFixed(2)} hours`,
      newTime: `${(totalSeconds/3600).toFixed(2)} hours`,
      difference: `${((totalSeconds - currentTime)/3600).toFixed(2)} hours`
    });
    
    return true;
  } catch (error) {
    logError(`Error updating post ${recordId}:`, error);
    return false;
  }
}

/**
 * Get all posts with their lastPost and createdAt fields
 * @returns {Promise<Array>} Array of posts with their IDs and fields
 */
export async function getPostsForHackatimeSync() {
  try {
    log('Fetching posts from Posts table...');
    const records = await base('Posts')
      .select({
        fields: ['lastPost', 'createdAt', 'neighbor', 'app', 'slackId', 'hackatimeProjects']
      })
      .all();
    
    log(`Found ${records.length} posts`);
    return records;
  } catch (error) {
    logError('Error fetching posts:', error);
    throw error;
  }
}
