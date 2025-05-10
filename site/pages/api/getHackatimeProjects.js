import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID,
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slackId } = req.query;

  if (!slackId) {
    return res.status(400).json({ error: 'Slack ID is required' });
  }

  try {
    // Query the Airtable base for hackatime projects
    const records = await base('hackatimeProjects')
      .select({
        filterByFormula: `{slackId} = '${slackId}'`,
        maxRecords: 100
      })
      .firstPage();

    // Extract project data
    const projects = records.map(record => ({
      id: record.id,
      ...record.fields
    }));

    return res.status(200).json({ projects });
  } catch (error) {
    console.error('Error fetching Hackatime projects:', error);
    return res.status(500).json({ error: 'Failed to fetch Hackatime projects' });
  }
} 