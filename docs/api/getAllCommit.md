# GetAllCommits

endpoint : /api/GetCommits
method : POST

## Arguments

| Name        | Type   | Required | Description                                                                 |
|-------------|--------|----------|-----------------------------------------------------------------------------|
| token      | string | true     | The token to authenticate the request.                                      |
| app       | string | true     | The app to get the commits for.                                          |
| start_time    | unix timestampt | false    | The start time for the commits to be fetched. If not provided, it will fetch all commits. |
| end_time      | unix timestamp | false    | The end time for the commits to be fetched. If not provided, it will fetch all commits. |
| git_username | string | true    | The git username to filter the commits by. If not provided, it will fetch all commits. |

## Response

| Name        | Type   | Description                                                                 |
