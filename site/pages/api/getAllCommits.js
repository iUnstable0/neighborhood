import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID,
);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { token, app, start_time, end_time, git_username } = req.query;

  if (!token || !app || !start_time || !end_time || !git_username) {
    return res.status(400).json({ message: "Missing required parameters" });
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

    const userEmail = userRecords[0].fields.email || userRecords[0].id;

    const commits = await base("commits")
      .select({
        filterByFormula: `AND(
          {neighbor} = '${userEmail}',
          {Apps} = '${app}',
          IS_AFTER({commitTime}, '${start_time}'),
          IS_BEFORE({commitTime}, '${end_time}')
        )`,
        fields: [
          "message",
          "githubLink",
          "videoLink",
          "commitTime",
          "sessions",
          "Type",
        ],
      })
      .all();

    await Promise.all(
      commits.map(async (commit) => {
        if (commit.fields.sessions?.length > 0) {
          const sessionRecords = await base("sessions")
            .select({
              filterByFormula: `RECORD_ID()='${commit.fields.sessions[0]}'`,
              fields: ["duration"],
              maxRecords: 1,
            })
            .firstPage();

          if (sessionRecords.length > 0) {
            commit.fields.duration = sessionRecords[0].fields.duration;
          }
        }
      }),
    );

    const appRecord = await base("Apps")
      .select({
        filterByFormula: `{Name} = '${app}'`,
        maxRecords: 1,
        fields: ["hackatimeProjects"],
      })
      .firstPage();

    if (appRecord.length === 0) {
      return res.status(404).json({ message: "App not found" });
    }

    const githubCommits = await Promise.all(
      appRecord[0].fields.hackatimeProjects.map(async (project) => {
        const projectRecord = await base("hackatimeProjects")
          .select({
            filterByFormula: `RECORD_ID()='${project}'`,
            maxRecords: 1,
            fields: ["githubLink"],
          })
          .firstPage();

        if (projectRecord.length > 0) {
          const githubLink = projectRecord[0].fields.githubLink;
          const match = githubLink.match(/github\.com\/([^/]+)\/([^/]+)/);
          if (!match) throw new Error("Invalid GitHub link format");

          const [_, owner, repo] = match;

          const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/commits?author=${git_username}&since=${start_time}&until=${end_time}`,
            { headers: { Accept: "application/vnd.github.v3+json" } },
          );

          if (!response.ok) {
            throw new Error(
              `GitHub API responded with status: ${response.status}`,
            );
          }

          const githubData = await response.json();
          return githubData.map((commit) => ({
            message: commit.commit.message,
            link: commit.html_url,
            duration: null,
            type: "github",
          }));
        }

        return [];
      }),
    );

    const formattedCommits = commits.map((commit) => ({
      message: commit.fields.message,
      link: commit.fields.githubLink || commit.fields.videoLink,
      duration: commit.fields.duration || null,
      type: "video",
    }));

    const allCommits = [...formattedCommits, ...githubCommits.flat()];
    return res.status(200).json(allCommits);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}
