import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID,
);

// Validation regex patterns
const tokenRegex = /^[A-Za-z0-9_-]{10,}$/;
const recordIdRegex = /^rec[a-zA-Z0-9]{14}$/;
const urlRegex =
  /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { token, commitMessage, videoUrl, projectName, appId, session } =
    req.body;

  if (
    !token ||
    !commitMessage ||
    !videoUrl ||
    !projectName ||
    !appId ||
    !session
  ) {
    console.log("Missing required parameters:", {
      token,
      commitMessage,
      videoUrl,
      projectName,
      appId,
      session,
    });
    return res.status(400).json({ message: "Missing required parameters" });
  }

  // Validate token format
  if (!tokenRegex.test(token)) {
    return res.status(400).json({ message: "Invalid token format" });
  }

  // Validate appId format
  if (!recordIdRegex.test(appId)) {
    return res.status(400).json({ message: "Invalid app ID format" });
  }

  // Validate videoUrl format
  if (!urlRegex.test(videoUrl)) {
    return res.status(400).json({ message: "Invalid video URL format" });
  }

  // Validate commitMessage
  if (typeof commitMessage !== "string" || commitMessage.length > 1000) {
    return res
      .status(400)
      .json({ message: "Invalid commit message format or length" });
  }

  // Validate projectName
  if (typeof projectName !== "string" || projectName.length > 100) {
    return res
      .status(400)
      .json({ message: "Invalid project name format or length" });
  }

  try {
    // Escape single quotes in token to prevent formula injection
    const safeToken = token.replace(/'/g, "\\'");
    const userRecords = await base("neighbors")
      .select({
        filterByFormula: `{token} = '${safeToken}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (userRecords.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const userRecord = userRecords[0];
    console.log("Found user:", userRecord.id);

    // Verify the app exists
    try {
      const app = await base("Apps").find(appId);
      console.log("Found app:", app.id, "with name:", app.fields.Name);
    } catch (error) {
      console.error("App not found:", appId);
      return res.status(404).json({ message: "App not found" });
    }

    // Sanitize inputs before storing
    const sanitizedMessage = commitMessage.trim().substring(0, 1000);
    const sanitizedProjectName = projectName.trim().substring(0, 100);

    const commitFields = {
      message: sanitizedMessage,
      videoLink: videoUrl,
      commitTime: new Date().toISOString(),
      sessions: [session],
      neighbor: [userRecord.id],
      Apps: [appId],
      Type: "P", // Set as Pending by default
    };

    console.log(
      "Creating commit with fields:",
      JSON.stringify(commitFields, null, 2),
    );
    console.log("App ID being used:", appId);

    const commitRecord = await base("commits").create(
      [
        {
          fields: commitFields,
        },
      ],
      { typecast: true },
    );

    console.log(
      "Commit created in Airtable. Response:",
      JSON.stringify(
        {
          id: commitRecord[0].id,
          fields: commitRecord[0].fields,
        },
        null,
        2,
      ),
    );
    return res.status(201).json(commitRecord);
  } catch (error) {
    console.error("Error creating commit:", error);
    console.error("Detailed error info:", {
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode,
    });
    // Don't expose detailed error messages to client
    return res.status(500).json({ message: "Failed to create commit" });
  }
}
