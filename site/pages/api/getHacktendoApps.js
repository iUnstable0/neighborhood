import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID,
);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    // Get all apps that have isHacktendo checked
    const apps = await base("Apps")
      .select({
        fields: ["Name", "Icon", "App Link", "Images", "Description", "Neighbors", "createdAt", "isHacktendo", "YSWS Project Submission–Created At"],
        filterByFormula: "AND({isHacktendo} = 1, NOT({YSWS Project Submission–Created At} = ''))"
      })
      .all();

    // Format the apps data
    const formattedApps = apps.map(app => {
      // Handle icon URL
      let iconUrl = null;
      if (app.fields.Icon) {
        if (typeof app.fields.Icon === 'string') {
          iconUrl = app.fields.Icon;
        } else if (Array.isArray(app.fields.Icon) && app.fields.Icon.length > 0) {
          iconUrl = app.fields.Icon[0].url;
        }
      }

      // Handle images
      let images = [];
      if (app.fields.Images) {
        if (typeof app.fields.Images === 'string') {
          images = [app.fields.Images];
        } else if (Array.isArray(app.fields.Images)) {
          images = app.fields.Images.map(img => img.url);
        }
      }

      return {
        id: app.id,
        name: app.fields.Name || "Unnamed App",
        icon: iconUrl,
        appLink: app.fields["App Link"] || "",
        description: app.fields.Description || "",
        createdAt: app.fields.createdAt || null,
        images: images,
        memberCount: (app.fields.Neighbors || []).length,
        hasImages: images.length > 0
      };
    });

    // Sort apps: first by having images, then by member count
    const sortedApps = formattedApps.sort((a, b) => {
      // First sort by having images
      if (a.hasImages && !b.hasImages) return -1;
      if (!a.hasImages && b.hasImages) return 1;
      
      // Then sort by member count
      return b.memberCount - a.memberCount;
    });

    // Remove the hasImages property before sending response
    const finalApps = sortedApps.map(({ hasImages, ...app }) => app);

    return res.status(200).json({ apps: finalApps });
  } catch (error) {
    console.error("Error fetching Hacktendo apps:", error);
    return res.status(500).json({ message: "Error fetching Hacktendo apps", error: error.message });
  }
} 