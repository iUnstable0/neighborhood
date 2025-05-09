import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID,
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { token, projectName, startTime, endTime, videoUrl } = req.body;

  if (!token || !projectName || !startTime || !endTime || !videoUrl) {
    console.log("Missing required fields:", { token, projectName, startTime, endTime, videoUrl });
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    console.log("Looking up user with token:", token);
    const userRecords = await base("neighbors")
      .select({
        filterByFormula: `{token} = '${token}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (userRecords.length === 0) {
      console.log("User not found for token:", token);
      return res.status(404).json({ message: "User not found" });
    }

    const userRecord = userRecords[0];
    console.log("Found user:", userRecord.id);

    // Look up the project in the Apps table
    console.log("Looking up app:", projectName);
    const projectRecord = await base("Apps")
      .select({
        filterByFormula: `LOWER(TRIM({Name})) = LOWER(TRIM('${projectName}'))`,
        maxRecords: 1,
      })
      .firstPage();

    if (projectRecord.length === 0) {
      console.log(`App not found: "${projectName}"`);
      return res.status(404).json({ message: `App "${projectName}" not found` });
    }

    console.log("Found app:", projectRecord[0].id);

    // Look up or create hackatime project
    console.log("Looking up hackatime project:", projectName);
    const hackatimeProjectRecord = await base("hackatimeProjects")
      .select({
        filterByFormula: `LOWER(TRIM({name})) = LOWER(TRIM('${projectName}'))`,
        maxRecords: 1,
      })
      .firstPage();

    let hackatimeProjectId;
    if (hackatimeProjectRecord.length === 0) {
      console.log("Creating new hackatime project");
      const newHackatimeProject = await base("hackatimeProjects").create([
        {
          fields: {
            name: projectName,
            Apps: [projectRecord[0].id],
          },
        },
      ]);
      hackatimeProjectId = newHackatimeProject[0].id;
      console.log("Created hackatime project:", hackatimeProjectId);
    } else {
      hackatimeProjectId = hackatimeProjectRecord[0].id;
      console.log("Found existing hackatime project:", hackatimeProjectId);
    }

    // Create the session
    console.log("Creating session record");
    const sessionRecords = await base("sessions").create(
      [
        {
          fields: {
            neighbor: [userRecord.id],
            startTime: startTime,
            endTime: endTime,
            hackatimeProject: [hackatimeProjectId],
          },
        },
      ],
      { typecast: true },
    );
    console.log("Created session:", sessionRecords[0].id);

    // Create a commit record
    console.log("Creating commit record");
    const commitRecord = await base("commits").create([
      {
        fields: {
          message: "Stopwatch session",
          commitTime: new Date().toISOString(),
          sessions: [sessionRecords[0].id],
          neighbor: [userRecord.id],
          hackatimeProject: [hackatimeProjectId],
          videoLink: videoUrl,
        },
      },
    ]);
    console.log("Created commit:", commitRecord[0].id);

    // Update the Apps record with the new commit
    console.log("Updating Apps record with commit");
    const updatedApp = await base("Apps").update([
      {
        id: projectRecord[0].id,
        fields: {
          Name: projectRecord[0].fields.Name, // Preserve the name
          Commits: [...(projectRecord[0].fields.Commits || []), commitRecord[0].id],
        },
      },
    ]);
    console.log("Updated app:", updatedApp[0].id);

    return res.status(201).json(sessionRecords);
  } catch (error) {
    console.error("Detailed error:", {
      name: error.name,
      message: error.message,
      statusCode: error.statusCode,
      stack: error.stack
    });
    return res.status(500).json({ 
      message: "Internal server error",
      error: error.message,
      statusCode: error.statusCode 
    });
  }
}
