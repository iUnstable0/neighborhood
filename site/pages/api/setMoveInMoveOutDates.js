import Airtable from 'airtable';

// Initialize Airtable
const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY
}).base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { token, moveInDate, moveOutDate } = req.body;

  if (!token || !moveInDate || !moveOutDate) {
    return res.status(400).json({ message: 'Token, move-in date, and move-out date are required' });
  }

  try {
    // Find the user by token
    const records = await base(process.env.AIRTABLE_TABLE_ID)
      .select({
        filterByFormula: `{token} = '${token}'`,
        maxRecords: 1
      })
      .firstPage();

    if (records.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userId = records[0].id;

    // Update the user's move-in and move-out dates
    await base(process.env.AIRTABLE_TABLE_ID).update([
      {
        id: userId,
        fields: {
          'move-in-date': moveInDate,
          'move-out-date': moveOutDate
        }
      }
    ]);

    return res.status(200).json({ message: 'Move-in and move-out dates updated successfully' });
  } catch (error) {
    console.error('Airtable Error:', error);
    return res.status(500).json({
      message: 'Error updating move-in/move-out dates',
      error: error.message
    });
  }
} 