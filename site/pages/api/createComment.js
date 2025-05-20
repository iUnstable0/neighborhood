import Airtable from 'airtable';

// Initialize Airtable
const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY
}).base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { content, postId, neighborToken } = req.body;

  // Log received values to help with debugging
  console.log('Received values:', { content, postId, neighborToken });

  if (!content || !postId || !neighborToken) {
    return res.status(400).json({ 
      message: 'Missing required fields',
      received: { 
        content: !!content, 
        postId: !!postId, 
        neighborToken: !!neighborToken 
      }
    });
  }
  
  // Basic validation for Airtable record ID format
  if (postId && typeof postId === 'string' && !postId.startsWith('rec')) {
    console.warn(`Warning: postId "${postId}" does not look like an Airtable record ID (should start with 'rec')`);
  }

  try {
    // Look up neighbor record by token
    let neighborId = neighborToken;
    try {
      const neighborRecords = await base('neighbors')
        .select({ filterByFormula: `{token} = '${neighborToken}'`, maxRecords: 1 })
        .firstPage();
      if (neighborRecords.length > 0) {
        neighborId = neighborRecords[0].id;
      }
    } catch (e) {
      console.error('Error finding neighbor by token:', e);
      // fallback: just use the token if lookup fails
    }

    // Create the comment with the current timestamp
    const now = new Date();
    const newRecord = await base('Comments').create([
      {
        fields: {
          content,
          post: [postId], // Ensure this is always an array
          sentFrom: [neighborId], // Also ensure this is an array for linked records
        }
      }
    ]);

    console.log('Comment created:', newRecord[0].id);

    return res.status(200).json({
      message: 'Comment posted successfully',
      record: newRecord[0]
    });
  } catch (error) {
    console.error('Error posting comment:', error);
    return res.status(500).json({
      message: 'Error posting comment',
      error: error.message,
      stack: error.stack,
      airtableError: error.error || error.data || null
    });
  }
} 