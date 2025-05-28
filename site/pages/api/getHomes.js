import Airtable from 'airtable';

// Initialize Airtable
const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY
}).base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Fetch records from the Homes table in Airtable
    const records = await base('Houses')
      .select({
        sort: [{ field: 'Name', direction: 'asc' }],
        maxRecords: 100
      })
      .all();

    // Log the first record structure for debugging
    if (records.length > 0) {
      console.log('First home record structure:');
      console.log('record.id:', records[0].id);
      console.log('record.fields:', Object.keys(records[0].fields));
    }

    // Process the data
    const homes = records.map(record => {
      const fields = { ...record.fields };
      
      // Process thumbnails and photos which are likely to be attachments in Airtable
      let thumbnail = null;
      if (fields.Thumbnail && Array.isArray(fields.Thumbnail) && fields.Thumbnail.length > 0) {
        thumbnail = fields.Thumbnail[0].url;
      }
      
      let photos = [];
      if (fields.Photos && Array.isArray(fields.Photos) && fields.Photos.length > 0) {
        photos = fields.Photos.map(photo => photo.url);
      }
      
      return {
        id: record.id,
        name: fields.Name || 'Unnamed Home',
        description: fields.Description || '',
        thumbnail: thumbnail,
        photos: photos,
        address: fields.Address || '',
        rooms: fields.Rooms || [],
        roommates: fields.roommates || []
      };
    });

    return res.status(200).json({ homes });
  } catch (error) {
    console.error('Error fetching homes:', error);
    return res.status(500).json({
      message: 'Error fetching homes',
      error: error.message
    });
  }
} 