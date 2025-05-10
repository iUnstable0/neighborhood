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
    // Fetch Hackatime data directly from their API
    const hackatimeResponse = await fetch(
      `https://hackatime.hackclub.com/api/v1/users/${slackId}/stats?features=projects&start_date=2025-04-30`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!hackatimeResponse.ok) {
      throw new Error(`Hackatime API responded with status: ${hackatimeResponse.status}`);
    }

    const hackatimeData = await hackatimeResponse.json();
    
    // Get all project names
    const projectNames = hackatimeData.data.projects.map(p => p.name);

    // Check which projects are already attributed
    const existingProjects = await base("hackatimeProjects")
      .select({
        filterByFormula: `OR(${projectNames.map(name => `{name} = '${name}'`).join(",")})`,
      })
      .all();

    // Create a map of project names to their attribution info
    const attributionMap = new Map();
    for (const project of existingProjects) {
      attributionMap.set(project.fields.name, {
        isAttributed: project.fields.Apps && project.fields.Apps.length > 0,
        attributedToAppId: project.fields.Apps && project.fields.Apps.length > 0 ? project.fields.Apps[0] : null
      });
    }

    // Add attribution status to each project
    const projectsWithStatus = hackatimeData.data.projects.map(project => {
      const attributionInfo = attributionMap.get(project.name) || { isAttributed: false, attributedToAppId: null };
      return {
        ...project,
        isAttributed: attributionInfo.isAttributed,
        attributedToAppId: attributionInfo.attributedToAppId
      };
    });
    
    // Return the projects data with attribution status
    return res.status(200).json({
      projects: projectsWithStatus || []
    });

  } catch (error) {
    console.error('Error fetching Hackatime projects:', error);
    return res.status(500).json({ error: 'Failed to fetch Hackatime projects' });
  }
} 