import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID,
);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: "Missing token" });
  }

  try {
    const userRecords = await base(process.env.AIRTABLE_TABLE_ID)
      .select({
        filterByFormula: `{token} = '${token}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (userRecords.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userEmail = userRecords[0].fields.email;
    const userId = userRecords[0].id;

    // Get all apps attributed to this user
    const userApps = await base("Apps")
      .select({
        filterByFormula: `FIND("${userId}", {Neighbors})`,
        fields: ["Name", "Icon", "createdAt"],
      })
      .all();

    // Format the apps data
    const apps = userApps.map(app => ({
      id: app.id,
      name: app.fields.Name || "Unnamed App",
      icon: app.fields.Icon || null,
      createdAt: app.fields.createdAt || null
    }));

    return res.status(200).json({ apps });
  } catch (error) {
    console.error("Error fetching apps:", error);
    return res.status(500).json({ message: "Error fetching apps" });
  }
} 