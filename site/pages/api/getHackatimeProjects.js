import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID,
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { slackId, userId } = req.query;

  if (!slackId || !userId) {
    return res.status(400).json({ error: 'Slack ID and user ID are required' });
  }

  try {
    // Fetch Hackatime data directly from their API
    console.log(`[DEBUG] Fetching Hackatime data for slackId: ${slackId}`);
    const hackatimeResponse = await fetch(
      `https://hackatime.hackclub.com/api/v1/users/${slackId}/stats?features=projects&start_date=2025-04-30`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!hackatimeResponse.ok) {
      console.error(`[ERROR] Hackatime API responded with status: ${hackatimeResponse.status}`);
      throw new Error(`Hackatime API responded with status: ${hackatimeResponse.status}`);
    }

    const hackatimeData = await hackatimeResponse.json();
    console.log("[DEBUG] Hackatime data projects:", JSON.stringify(hackatimeData.data.projects, null, 2));
    
    // Get all project names
    const projectNames = hackatimeData.data.projects.map(p => p.name);
    console.log("[DEBUG] Project names:", projectNames);

    // Safety check for empty projects array
    if (projectNames.length === 0) {
      console.log("[DEBUG] No projects found in Hackatime data, returning empty array");
      return res.status(200).json({ projects: [] });
    }

    // Use SEARCH() function in Airtable formula to avoid issues with special characters
    const filterFormula = `OR(${projectNames.map(name => {
      // Double the quotes to escape them in Airtable formula string
      const escapedName = name.replace(/"/g, '""');
      return `{name}="${escapedName}"`;
    }).join(",")})`;
    console.log("[DEBUG] Generated filter formula:", filterFormula);
    
    // Check which projects are already attributed
    const existingProjects = await base("hackatimeProjects")
      .select({
        filterByFormula: filterFormula,
        fields: ['name', 'neighbor', 'Apps']
      })
      .all();

    console.log("[DEBUG] Found existing projects:", existingProjects.map(p => ({
      id: p.id,
      name: p.fields.name,
      hasNeighbor: !!p.fields.neighbor,
      neighborIds: p.fields.neighbor
    })));

    // Filter for matching neighbor in JavaScript
    const filteredProjects = existingProjects.filter(project => 
      project.fields.neighbor && 
      project.fields.neighbor.includes(userId)
    );

    console.log("[DEBUG] Projects after neighbor filter:", filteredProjects.map(p => ({
      name: p.fields.name,
      neighbor: p.fields.neighbor
    })));

    // Create a map of project names to their attribution info
    const attributionMap = new Map();
    for (const project of filteredProjects) {
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
    
    console.log("[DEBUG] Final projects with status:", projectsWithStatus.map(p => ({
      name: p.name,
      isAttributed: p.isAttributed,
      attributedToAppId: p.attributedToAppId
    })));

    // Return the projects data with attribution status
    return res.status(200).json({
      projects: projectsWithStatus || []
    });

  } catch (error) {
    console.error('[ERROR] Error fetching Hackatime projects:', error);
    console.error('[ERROR] Error stack:', error.stack);
    return res.status(500).json({ error: 'Failed to fetch Hackatime projects' });
  }
} 