import Airtable from 'airtable';

// Initialize Airtable
const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY
}).base(process.env.AIRTABLE_BASE_ID);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { token, projectName } = req.body;

  if (!token || !projectName) {
    return res.status(400).json({ message: 'Token and project name are required' });
  }

  try {
    // First, find the user by token
    const userRecords = await base(process.env.AIRTABLE_TABLE_ID)
      .select({
        filterByFormula: `{token} = '${token}'`,
        maxRecords: 1
      })
      .firstPage();

    if (userRecords.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userEmail = userRecords[0].fields.email;
    const userId = userRecords[0].id;

    // Find the project record by name
    const projectRecords = await base('hackatimeProjects')
      .select({
        filterByFormula: `{name} = '${projectName}'`,
        maxRecords: 1
      })
      .firstPage();

    if (projectRecords.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const projectRecord = projectRecords[0];
    const currentNeighbors = projectRecord.fields.neighbor || [];

    // Remove this user from the project's neighbors
    const updatedNeighbors = currentNeighbors.filter(id => id !== userId);

    if (updatedNeighbors.length === 0) {
      // If no neighbors left, delete the project
      await base('hackatimeProjects').destroy([projectRecord.id]);
    } else {
      // Otherwise just update the neighbors list
      await base('hackatimeProjects').update(projectRecord.id, {
        neighbor: updatedNeighbors
      });
    }

    return res.status(200).json({
      message: 'Project association removed successfully'
    });

  } catch (error) {
    console.error('Airtable Error:', error);
    return res.status(500).json({
      message: 'Error removing project',
      error: error.message
    });
  }
} 