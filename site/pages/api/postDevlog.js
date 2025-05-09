import Airtable from 'airtable';

// Initialize Airtable
const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY
}).base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { demoVideo, photoboothVideo, description, neighbor, app } = req.body;

  if (!demoVideo || !photoboothVideo || !description || !neighbor || !app) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Look up neighbor record by token to get their email
    let neighborId = neighbor;
    try {
      const neighborRecords = await base('neighbors')
        .select({ filterByFormula: `{token} = '${neighbor}'`, maxRecords: 1 })
        .firstPage();
      if (neighborRecords.length > 0) {
        neighborId = neighborRecords[0].id;
      }
    } catch (e) {
      // fallback: just use the token if lookup fails
    }

    // Look up app record by name to get its id
    let appId = app;
    try {
      const appRecords = await base('Apps')
        .select({ filterByFormula: `{Name} = '${app}'`, maxRecords: 1 })
        .firstPage();
      if (appRecords.length > 0) {
        appId = appRecords[0].id;
      }
    } catch (e) {
      // fallback: just use the name if lookup fails
    }

    console.log('neighborId:', neighborId);
    console.log('appId:', appId);

    // Fetch all posts and filter in JS
    let lastPostDate = '2025-04-29T00:00:00.000Z';
    try {
      const allPosts = await base('Posts')
        .select({
          // Only fetch posts with this neighbor in the neighbor array
          // (Airtable doesn't support array-contains, so we fetch more and filter in JS)
          maxRecords: 10000, // adjust as needed
          sort: [{ field: 'createdAt', direction: 'desc' }]
        })
        .all();

      // Filter posts where neighbor array contains neighborId
      const userPosts = allPosts.filter(post =>
        Array.isArray(post.fields.neighbor) && post.fields.neighbor.includes(neighborId)
      );

      if (userPosts.length > 0) {
        lastPostDate = userPosts[0]._rawJson.createdTime;
        console.log('lastPostDate from previous post:', lastPostDate);
      } else {
        console.log('No previous posts found, using default lastPostDate:', lastPostDate);
      }
    } catch (e) {
      console.log('Error fetching previous posts:', e);
      // fallback: use April 29, 2025 midnight UTC
    }

    console.log('Final lastPostDate to be set:', lastPostDate);

    // Now create the post
    const newRecord = await base('Posts').create([
      {
        fields: {
          demoVideo,
          photoboothVideo,
          description,
          neighbor: [neighborId],
          app: [appId],
          lastPost: lastPostDate,
        }
      }
    ]);

    return res.status(200).json({
      message: 'Devlog posted successfully',
      record: newRecord[0]
    });
  } catch (error) {
    console.error('Error posting devlog:', error);
    return res.status(500).json({
      message: 'Error posting devlog',
      error: error.message,
      stack: error.stack,
      airtableError: error.error || error.data || null
    });
  }
} 