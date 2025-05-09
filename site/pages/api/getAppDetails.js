import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID,
);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { token, appId } = req.query;

  if (!token || !appId) {
    return res.status(400).json({ message: "Token and app ID are required" });
  }

  try {
    console.log(`Fetching app details for app ID: ${appId}`);
    
    // Get user data from token
    const userRecords = await base(process.env.AIRTABLE_TABLE_ID)
      .select({
        filterByFormula: `{token} = '${token}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (userRecords.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userId = userRecords[0].id;
    console.log(`User found with ID: ${userId}`);

    // Get the app
    const appRecords = await base("Apps")
      .select({
        filterByFormula: `RECORD_ID() = '${appId}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (appRecords.length === 0) {
      console.log(`No app found with ID: ${appId}`);
      return res.status(404).json({ message: "App not found" });
    }

    const app = appRecords[0];
    console.log(`App found: ${app.fields.Name}`);
    console.log(`App fields: ${Object.keys(app.fields).join(', ')}`);
    
    const neighbors = app.fields.Neighbors || [];
    console.log(`App neighbors: ${neighbors}`);

    // Check if user is a member of this app
    if (!neighbors.includes(userId)) {
      console.log(`User ${userId} is not a member of this app's neighbors: ${neighbors}`);
      return res.status(403).json({ message: "You don't have permission to view this app's details" });
    }

    // Format the app data
    // Handle the Icon field - can be either a URL string or an attachment array
    let iconUrl = null;
    if (app.fields.Icon) {
      if (typeof app.fields.Icon === 'string') {
        // Direct URL string
        iconUrl = app.fields.Icon;
      } else if (Array.isArray(app.fields.Icon) && app.fields.Icon.length > 0) {
        // Attachment array
        iconUrl = app.fields.Icon[0].url;
      }
      console.log(`Icon URL found: ${iconUrl}`);
    }
    
    const appData = {
      id: app.id,
      name: app.fields.Name || "",
      icon: iconUrl,
      appLink: app.fields["App Link"] || "",
      githubLink: app.fields["Github Link"] || "",
      description: app.fields.Description || "",
      createdAt: app.fields.createdAt || null,
      images: app.fields.Images ? app.fields.Images.split(',') : []
    };
    
    console.log(`Returning app data for: ${appData.name}`);
    
    return res.status(200).json({
      app: appData
    });
  } catch (error) {
    console.error("Error fetching app details:", error);
    return res.status(500).json({ message: "Error fetching app details", error: error.message });
  }
} 