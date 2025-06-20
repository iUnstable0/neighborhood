import Airtable from "airtable";

// Initialize Airtable
const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID);

// Validation regex patterns
const tokenRegex = /^[A-Za-z0-9_-]{10,}$/;
const urlRegex =
  /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
const recordIdRegex = /^rec[a-zA-Z0-9]{14}$/;

async function createMoleCheck(appLink, githubUrl) {
  try {
    console.log("Attempting to create mole check with:", {
      appLink,
      githubUrl,
    });

    const response = await fetch(
      "https://adventure-time.hackclub.dev/api/moleCreate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          appLink,
          githubUrl,
        }),
      },
    );

    console.log("Mole check response status:", response.status);
    console.log("Mole check response headers:", response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.log("Mole check error response:", errorText);
      return null;
    }

    const data = await response.json();
    console.log("Mole check successful response:", data);
    return data;
  } catch (error) {
    console.log("Error creating mole check:", error);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { demoVideo, photoboothVideo, description, neighbor, app } = req.body;

  if (!demoVideo || !photoboothVideo || !description || !neighbor || !app) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // Validate input formats
  if (!urlRegex.test(demoVideo)) {
    return res.status(400).json({ message: "Invalid demo video URL format" });
  }

  if (!urlRegex.test(photoboothVideo)) {
    return res
      .status(400)
      .json({ message: "Invalid photobooth video URL format" });
  }

  // Validate description length
  if (typeof description !== "string" || description.length > 3000) {
    return res
      .status(400)
      .json({
        message: "Invalid description format or length (max 3000 characters)",
      });
  }

  // Validate neighbor (token) format
  if (!tokenRegex.test(neighbor)) {
    return res.status(400).json({ message: "Invalid neighbor token format" });
  }

  try {
    // Look up neighbor record by token to get their email
    let neighborId = neighbor;
    try {
      // Escape single quotes to prevent formula injection
      const safeNeighbor = neighbor.replace(/'/g, "\\'");
      const neighborRecords = await base("neighbors")
        .select({
          filterByFormula: `{token} = '${safeNeighbor}'`,
          maxRecords: 1,
        })
        .firstPage();
      if (neighborRecords.length > 0) {
        neighborId = neighborRecords[0].id;
      }
    } catch (e) {
      console.error("Error finding neighbor:", e);
      // fallback: just use the token if lookup fails
    }

    // Look up app record by name to get its id and links
    let appId = app;
    let appLink = null;
    let githubUrl = null;
    try {
      // Check if app is already a record ID
      if (recordIdRegex.test(app)) {
        const appRecord = await base("Apps").find(app);
        appId = appRecord.id;
        appLink = appRecord.fields["App Link"] || null;
        githubUrl = appRecord.fields["Github Link"] || null;
      } else {
        // Escape single quotes to prevent formula injection
        const safeApp = app.replace(/'/g, "\\'");
        const appRecords = await base("Apps")
          .select({ filterByFormula: `{Name} = '${safeApp}'`, maxRecords: 1 })
          .firstPage();
        if (appRecords.length > 0) {
          appId = appRecords[0].id;
          appLink = appRecords[0].fields["App Link"] || null;
          githubUrl = appRecords[0].fields["Github Link"] || null;
        }
      }
    } catch (e) {
      console.error("Error finding app:", e);
      // fallback: just use the name if lookup fails
    }

    console.log("neighborId:", neighborId);
    console.log("appId:", appId);
    console.log("appLink:", appLink);
    console.log("githubUrl:", githubUrl);

    // Fetch all posts and filter in JS
    let lastPostDate = "2025-04-29T00:00:00.000Z";
    try {
      const allPosts = await base("Posts")
        .select({
          maxRecords: 10000,
          sort: [{ field: "createdAt", direction: "desc" }],
        })
        .all();

      const userPosts = allPosts.filter(
        (post) =>
          Array.isArray(post.fields.neighbor) &&
          post.fields.neighbor.includes(neighborId),
      );

      if (userPosts.length > 0) {
        lastPostDate = userPosts[0]._rawJson.createdTime;
        console.log("lastPostDate from previous post:", lastPostDate);
      } else {
        console.log(
          "No previous posts found, using default lastPostDate:",
          lastPostDate,
        );
      }
    } catch (e) {
      console.log("Error fetching previous posts:", e);
    }

    console.log("Final lastPostDate to be set:", lastPostDate);

    // Sanitize inputs before storing
    const sanitizedDemoVideo = demoVideo.trim();
    const sanitizedPhotoboothVideo = photoboothVideo.trim();
    const sanitizedDescription = description.trim().substring(0, 3000);

    // Now create the post
    const newRecord = await base("Posts").create([
      {
        fields: {
          demoVideo: sanitizedDemoVideo,
          photoboothVideo: sanitizedPhotoboothVideo,
          description: sanitizedDescription,
          neighbor: [neighborId],
          app: [appId],
          lastPost: lastPostDate,
        },
      },
    ]);

    // Create mole check if we have both appLink and githubUrl from the app record
    let moleCheckResult = null;
    if (appLink && githubUrl) {
      moleCheckResult = await createMoleCheck(appLink, githubUrl);
    }

    return res.status(200).json({
      message: "Devlog posted successfully",
      record: newRecord[0],
    });
  } catch (error) {
    console.error("Error posting devlog:", error);
    console.error("Detailed error info:", {
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode,
      airtableError: error.error || error.data || null,
    });
    // Don't expose detailed error messages to client
    return res.status(500).json({
      message: "Error posting devlog",
    });
  }
}
