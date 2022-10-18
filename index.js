import * as core from "@actions/core";
import { context, getOctokit } from "@actions/github";

async function run() {
  const token = core.getInput("token");
  const slackWebhook = core.getInput("slack-webhook");

  // Mask values when logging
  core.setSecret(token);
  core.setSecret(slackWebhook);

  const repoOwner = context.repo.owner;
  const repo = context.repo.repo;
  const wfRunId = context.runId;

  // Authenticate with GitHub
  const octokit = getOctokit(token);

  console.log(octokit);

  // Fetch workflow run data
  const { data: wfRun } = await octokit.actions.getWorkflowRun({
    owner: repoOwner,
    repo: repo,
    run_id: wfRunId,
  });

  // Fetch jobs data for the same workflow run
  const { data: jobsResponse } = await octokit.actions.listJobsForWorkflowRun({
    owner: repoOwner,
    repo: repo,
    run_id: wfRunId,
  });

  console.log(wfRun);
  console.log(jobsResponse);

  // Extract the data we need for creating the Slack message
  const commitAuthor = wfRun.data.actor.login;
  const avatarUrl = wfRun.data.actor.avatar_url;
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

  // Create Slack message
  const slackMessage = {
    attachments: [
      {
        color: `${failedJobs.length == 0 ? "good" : "danger"}`,
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
  // console.log("Slack message: ", JSON.stringify(slackMessage));

  // Send message to Slack
  var xhr = new XMLHttpRequest();
  xhr.open("POST", slackWebhook, true);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(JSON.stringify(slackMessage));
}

run().catch((error) => {
  core.setFailed(error.message);
  console.error(error.stack);
});
