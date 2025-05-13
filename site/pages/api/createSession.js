import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID,
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { token, projectName, appId, startTime, endTime, videoUrl } = req.body;

  if (!token || !startTime || !endTime) {
    console.log("Missing required fields:", { token, startTime, endTime });
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const userRecords = await base("neighbors")
      .select({
        filterByFormula: `{token} = '${token}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (userRecords.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userRecord = userRecords[0];
    console.log("Found user:", userRecord.id);

    const sessionRecords = await base("sessions").create(
      [
        {
          fields: {
            neighbor: [userRecord.id],
            startTime: startTime,
            endTime: endTime,
          },
        },
      ],
      { typecast: true },
    );

    console.log("Session created:", sessionRecords);
    return res.status(201).json(sessionRecords);
  } catch (error) {
    console.error("Error creating session:", error);
    return res.status(500).json({ message: error.message || "Internal server error" });
  }
}
