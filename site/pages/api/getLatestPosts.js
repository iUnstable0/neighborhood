import Airtable from 'airtable';

// Initialize Airtable
const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY
}).base(process.env.AIRTABLE_BASE_ID);

async function getRecordName(table, id, field = 'Name') {
  if (!id) return null;
  try {
    const rec = await base(table).find(id);
    if (table === 'neighbors') {
      // Try Full Name, then email, then Name
      return rec.fields['Full Name'] || rec.fields['Slack Handle (from slackNeighbor)'] || rec.fields['Full Name (from slackNeighbor)'];
    }
    return rec.fields['Full Name'] || rec.fields['Slack Handle (from slackNeighbor)'] || rec.fields['Full Name (from slackNeighbor)'];
  } catch (e) {
    console.error(`Failed to fetch ${table} record for id ${id}:`, e.message);
    return id;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const records = await base('Posts')
      .select({
        sort: [{ field: 'createdAt', direction: 'desc' }],
        maxRecords: 100
      })
      .all();

    // Collect all unique app and neighbor IDs
    const appIds = new Set();
    const neighborIds = new Set();
    records.forEach(record => {
      const appField = record.fields.app;
      const neighborField = record.fields.neighbor;
      if (Array.isArray(appField)) {
        appField.forEach(id => appIds.add(id));
      } else if (appField) {
        appIds.add(appField);
      }
      if (Array.isArray(neighborField)) {
        neighborField.forEach(id => neighborIds.add(id));
      } else if (neighborField) {
        neighborIds.add(neighborField);
      }
    });

    // Fetch all apps and neighbors in parallel
    const [apps, neighbors] = await Promise.all([
      Promise.all(Array.from(appIds).map(id => getRecordName('Apps', id, 'Name'))),
      Promise.all(Array.from(neighborIds).map(id => getRecordName('neighbors', id)))
    ]);
    const appIdToName = {};
    Array.from(appIds).forEach((id, i) => { appIdToName[id] = apps[i]; });
    const neighborIdToName = {};
    Array.from(neighborIds).forEach((id, i) => { neighborIdToName[id] = neighbors[i]; });

    // Log mapping results
    console.log('App ID to Name:', appIdToName);
    console.log('Neighbor ID to Name:', neighborIdToName);

    const posts = records.map(record => {
      const fields = { ...record.fields };
      // Replace app and neighbor fields with names
      if (fields.app) {
        if (Array.isArray(fields.app)) {
          fields.app = fields.app.map(id => appIdToName[id] || id).join(', ');
        } else {
          fields.app = appIdToName[fields.app] || fields.app;
        }
      }
      if (fields.neighbor) {
        if (Array.isArray(fields.neighbor)) {
          fields.neighbor = fields.neighbor.map(id => neighborIdToName[id] || id).join(', ');
        } else {
          fields.neighbor = neighborIdToName[fields.neighbor] || fields.neighbor;
        }
      }
      return {
        ID: record.id,
        ...fields
      };
    });

    return res.status(200).json({ posts });
  } catch (error) {
    console.error('Error fetching latest posts:', error);
    return res.status(500).json({
      message: 'Error fetching latest posts',
      error: error.message
    });
  }
} 