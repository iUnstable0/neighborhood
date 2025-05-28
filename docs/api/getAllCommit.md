# GetAllCommits

endpoint : /api/GetCommits
method : POST

## Arguments

| Name        | Type   | Required | Description                                                                 |
|-------------|--------|----------|-----------------------------------------------------------------------------|
| token      | string | true     | The token to authenticate the request.                                      |
| app       | string | true     | The app to get the commits for.                                          |
| start_time    | ISO | false    | The start time for the commits to be fetched. If not provided, it will fetch all commits. |
| end_time      | ISO | false    | The end time for the commits to be fetched. If not provided, it will fetch all commits. |
| git_username | string | true    | The git username to filter the commits by. If not provided, it will fetch all commits. |

## Response

Array of objects containing the commit information.

Airtable commits contain the following fields:
| Name        | Type   | Description                                                                 |
|-------------|--------|-----------------------------------------------------------------------------|
| type     | string | The type of the commit. Can be one of the following: "video", "github"
| message   | string | The commit message. |
| duration   | number | The duration of the commit in minutes. |
| link      | string | The link to the video. |

Github commits contain the following fields:
| Name        | Type   | Description                                                                 |
|-------------|--------|-----------------------------------------------------------------------------|
| type     | string | The type of the commit. Can be one of the following: "video", "github"
| message   | string | The commit message. |
| link      | string | The link to the github commit. |
| duration   | number | The duration of the commit in minutes. |

__ Note: The duration is only available for Airtable commits. (soon to gh commits too)__
