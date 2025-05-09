import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID,
);

// Configure Next.js API to accept larger payloads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',  // Increased size limit to handle larger images
    },
  },
};

// Max size for icon in bytes
const MAX_ICON_SIZE = 5 * 1024 * 1024; // 5MB

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { token, appId, name, icon, appLink, githubLink, description, images } = req.body;

  // Debug request
  console.log("==== DEBUG: UPDATE APP REQUEST ====");
  console.log("App ID:", appId);
  console.log("App Name:", name);
  console.log("Icon provided:", !!icon);
  if (icon) {
    console.log("Icon type:", typeof icon);
    console.log("Icon length:", icon.length);
    // Limit icon preview to avoid flooding console
    console.log("Icon format:", icon.substring(0, 30) + "...");
  }

  if (!token || !appId || !name) {
    console.log("Missing required fields:", {
      hasToken: !!token,
      hasAppId: !!appId,
      hasName: !!name
    });
    return res.status(400).json({ message: "Token, app ID, and app name are required" });
  }

  try {
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

    // Get the app to verify ownership
    const appRecords = await base("Apps")
      .select({
        filterByFormula: `RECORD_ID() = '${appId}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (appRecords.length === 0) {
      return res.status(404).json({ message: "App not found" });
    }

    const currentNeighbors = appRecords[0].fields.Neighbors || [];
    
    // Check if user is a member of this app
    if (!currentNeighbors.includes(userId)) {
      return res.status(403).json({ message: "You don't have permission to edit this app" });
    }

    // Fetch the current app data to handle attachments correctly
    const currentApp = appRecords[0];
    console.log("Current app found:", currentApp.id);
    console.log("Current app fields:", Object.keys(currentApp.fields));
    console.log("Current icon:", currentApp.fields.Icon ? "Present" : "Not present");

    // Update app fields
    const appFields = {
      Name: name,
      "App Link": appLink || "",
      "Github Link": githubLink || "",
      Description: description || "",
    };
    
    // When updating an attachment field in Airtable, we have two options:
    // 1. If the current field has attachments and we want to keep them, don't include the field
    // 2. If we want to replace them, we need to explicitly set them to null or provide new ones
    
    // Handle icon - only modify if it's changed
    if (icon) {
      // Check if it's a URL (starting with http:// or https://)
      if (typeof icon === 'string' && (icon.startsWith('http://') || icon.startsWith('https://'))) {
        console.log("Processing icon URL:", icon.substring(0, 50) + "...");
        appFields.Icon = icon;
        console.log("Set icon URL as text");
      } else {
        console.log("Invalid icon format - must be a URL");
      }
    } else if (currentApp.fields.Icon) {
      // Preserve existing icon if no new one provided
      appFields.Icon = currentApp.fields.Icon;
      console.log("Preserving existing icon");
    }
    
    // Handle images as comma-separated URLs
    if (images && Array.isArray(images)) {
      console.log("Processing images:", images.length);
      // Filter out any non-URL values and join with commas
      const validUrls = images.filter(url => 
        typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))
      );
      if (validUrls.length > 0) {
        appFields.Images = validUrls.join(',');
        console.log("Set images as comma-separated URLs");
      }
    }
    
    // Update app record in Apps table
    console.log("Updating app with fields:", Object.keys(appFields));
    const updatedApp = await base("Apps").update([
      {
        id: appId,
        fields: appFields,
      },
    ]);
    console.log("App updated successfully");

    // Get the updated app to return full details
    console.log("Fetching refreshed app details");
    const refreshedApp = await base("Apps")
      .find(appId);

    console.log("Has Icon after update?", !!refreshedApp.fields.Icon);
    if (refreshedApp.fields.Icon) {
      console.log("Icon details after update:", JSON.stringify(refreshedApp.fields.Icon));
    }

    return res.status(200).json({
      message: "App updated successfully",
      app: {
        id: refreshedApp.id,
        name: refreshedApp.fields.Name || "",
        icon: refreshedApp.fields.Icon || null,
        appLink: refreshedApp.fields["App Link"] || "",
        githubLink: refreshedApp.fields["Github Link"] || "",
        description: refreshedApp.fields.Description || "",
        createdAt: refreshedApp.fields.createdAt || null,
        images: refreshedApp.fields.Images ? refreshedApp.fields.Images.split(',') : []
      },
    });
  } catch (error) {
    console.error("==== DEBUG: UPDATE APP ERROR ====");
    console.error("Error updating app:", error);
    console.error("Error message:", error.message);
    console.error("Error name:", error.name);
    console.error("Status code:", error.statusCode);
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
    return res.status(500).json({ 
      message: "Failed to update app", 
      error: error.message,
      statusCode: error.statusCode 
    });
  }
} 