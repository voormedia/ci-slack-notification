import { getInput, setFailed } from "@actions/core";
import { actions, request } from "@actions/github";

try {
  const [repoOwner, repo] = getInput("repo").split("/");
  const wfRunId = getInput("workflow-run-id");
  const slackWebhook = getInput("slack-webhook");

  console.log("Inputs");
  console.log(`repo: ${repoOwner}/${repo}`);
  console.log(`workflow-run-id: ${wfRunId}`);
  console.log(`slack-webhook: ${slackWebhook}`);

  // Retrieve workflow run data
  const wfRun = await actions.getWorkflowRun({
    owner: repoOwner,
    repo: repo,
    run_id: wfRunId,
  });
  const jobsResponse = await request(wfRun.data.jobs_url);

  // Parse data for message fields
  const commitAuthor = wfRun.data.actor.login;
  const avatarUrl = wfRun.data.actor.avatarUrl;
  const repositoryUrl = wfRun.data.repository.html_url;
  const repositoryName = wfRun.data.repository.full_name;
  const branchName = wfRun.data.head_branch;
  const branchUrl = repositoryUrl + "/tree/" + branchName;
  const commitSha = wfRun.data.head_sha;
  const commitUrl = repositoryUrl + "/commit/" + commitSha;
  const commitMessage = wfRun.data.display_title;

  const failedJobs = jobsResponse.data.jobs.filter(
    (job) => job.status == "completed" && job.conclusion == "failure"
  );
  const failedJobsWithLinks = failedJobs
    .map((job) => `<${job.html_url}|${job.name}>`)
    .join(", ");

  const slackMessage = {
    attachments: [
      {
        color: `${failedJobs.length == 0 ? "#36a64f" : "#8B0000"}`,
        blocks: [
          {
            type: "context",
            elements: [
              {
                type: "image",
                image_url: avatarUrl,
                alt_text: "cute cat",
              },
              {
                type: "mrkdwn",
                text: "*" + commitAuthor + "*",
              },
            ],
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `<${repositoryUrl}|*${repositoryName}*>`,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Branch:* <${branchUrl}|${branchName}>`,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Commit:* ${commitMessage} (<${commitUrl}|${commitSha}>)`,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text:
                failedJobs.length == 0
                  ? "All tests passed :rocket:"
                  : `*Failed job${
                      failedJobs.length > 1 ? "s" : ""
                    }:* ${failedJobsWithLinks}`,
            },
          },
        ],
      },
    ],
  };

  // For testing on Slack Block Kit Builder:
  console.log("Slack message: ", JSON.stringify(slackMessage));

  // Send message to Slack
  var xhr = new XMLHttpRequest();
  xhr.open("POST", slackWebhook, true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(JSON.stringify(slackMessage));
} catch (error) {
  setFailed(error.message);
}
