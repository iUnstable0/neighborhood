import Airtable from "airtable";

// Initialize Airtable base using API key and base ID from environment variables
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID, // Airtable base ID from environment variables
);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    // Only GET requests are allowed
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { token, app, start_time, end_time, git_username } = req.query;
  // `app` is a linked cell in Airtable

  if (!token || !app || !start_time || !end_time || !git_username) {
    // Ensure all required parameters are provided
    return res.status(400).json({ message: "Missing required parameters" });
  }

  let commits = []; // Airtable commits
  let data = []; // GitHub commits

  // Fetch Airtable commits
  try {
    // Fetch user record by token
    const userRecords = await base(process.env.AIRTABLE_TABLE_ID)
      .select({
        filterByFormula: `{token} = '${token}'`, // Match user by token
        maxRecords: 1, // Only fetch one record
      })
      .firstPage();

    if (userRecords.length === 0) {
      // No user found with the provided token
      return res.status(404).json({ message: "User not found" });
    }

    const userEmail = userRecords[0].fields.email || userRecords[0].id; // Use email or record ID as fallback

    // Fetch commits associated with the user and app
    commits = await base("commits")
      .select({
        filterByFormula: `AND({neighbor} = '${userEmail}', {Apps} = '${app}')`, // Match commits by user email and app
        fields: [
          "commitID",
          "message",
          "githubLink",
          "videoLink",
          "commitTime",
          "sessions",
          "neighbor",
          "Type",
        ],
      })
      .all();

    // Add duration by looking at the session and getting the duration fields
    await Promise.all(
      commits.map(async (commit) => {
        if (commit.fields.sessions && commit.fields.sessions.length > 0) {
          const sessionRecords = await base("sessions")
            .select({
              filterByFormula: `RECORD_ID()='${commit.fields.sessions[0]}'`, // Match session by record ID
              fields: ["duration"], // Only fetch the duration field
              maxRecords: 1, // Only fetch one record
            })
            .firstPage();

          if (sessionRecords.length > 0) {
            // Add duration to the commit fields
            commit.fields.duration = sessionRecords[0].fields.duration;
          }
        }
      }),
    );
  } catch (error) {
    console.error("Error fetching Airtable commits:", error); // Log the error for debugging
    return res.status(500).json({ message: "Error fetching Airtable commits" });
  }

  // Fetch GitHub commits
  try {
    // Get repo URL from app project
    const projectRecord = await base("Apps")
      .select({
        filterByFormula: `{Name} = '${app}'`, // Match app by name
        maxRecords: 1, // Only fetch one record
      })
      .firstPage();

    if (projectRecord.length === 0) {
      return res.status(404).json({ message: "App not found" });
    }

    let hackatimeProjectsOnApp = [];

    const repoUrls = hackatimeProjectsOnApp.map((project) => {
      const githubLink = project.fields.githubLink;
      const repoName = githubLink.split("github.com/")[1]; // Extract repo name from GitHub link
      return repoName.replace(/\.git$/, ""); // Remove .git if present
    });

    const fetchCommits = async (repoUrl) => {
      const response = await fetch(
        `https://api.github.com/repos/${repoUrl}/commits?since=${start_time}&until=${end_time}&author=${git_username}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, // Use GitHub token from environment variables
          },
        },
      );

      if (!response.ok) {
        console.error(
          `Error fetching commits for repo ${repoUrl}:`,
          response.statusText,
        );
        return [];
      }

      const commitsData = await response.json();
      return commitsData;
    };

    const commitPromises = repoUrls.map((repoUrl) => fetchCommits(repoUrl));
    const commitResults = await Promise.all(commitPromises);

    // Flatten the array of commit results
    const flattenedCommits = commitResults.flat();
    data = flattenedCommits.map((commit) => ({
      commit: commit.sha, // Commit SHA
      message: commit.commit.message, // Commit message
      githubLink: commit.html_url, // GitHub link to the commit
    }));
  } catch (error) {
    console.error("Error fetching GitHub data:", error); // Log the error but proceed
  }

  // Format both sources of commits in an array, each with a type (github or video)
  const formattedCommits = commits.map((commit) => ({
    ...commit.fields, // Include all fields from the commit
    type: "video", // Mark as video type
  }));

  const formattedGitHubCommits = data.map((commit) => ({
    commit: commit.commit, // Commit SHA
    message: commit.message, // Commit message
    githubLink: commit.githubLink, // GitHub link to the commit
    duration: null, // GitHub commits don't have a duration
    type: "github", // Mark as GitHub type
  }));

  const allCommits = [...formattedCommits, ...formattedGitHubCommits]; // Combine both sources of commits

  return res.status(200).json(allCommits); // Return all commits as the response
}
