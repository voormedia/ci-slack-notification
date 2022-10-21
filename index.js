import * as core from "@actions/core";
import { context, getOctokit } from "@actions/github";
import { IncomingWebhook } from "@slack/webhook";

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

  // Fetch workflow run data
  const { data: wfRun } = await octokit.rest.actions.getWorkflowRun({
    owner: repoOwner,
    repo: repo,
    run_id: wfRunId,
  });

  // Fetch jobs data for the same workflow run
  const { data: jobsResponse } =
    await octokit.rest.actions.listJobsForWorkflowRun({
      owner: repoOwner,
      repo: repo,
      run_id: wfRunId,
    });

  // Extract the data we need for creating the Slack message
  const commitAuthor = wfRun.actor.login;
  const avatarUrl = wfRun.actor.avatar_url;
  const repositoryUrl = wfRun.repository.html_url;
  const repositoryName = wfRun.repository.full_name;
  const branchName = wfRun.head_branch;
  const branchUrl = repositoryUrl + "/tree/" + branchName;
  const commitSha = wfRun.head_sha;
  const commitUrl = repositoryUrl + "/commit/" + commitSha;
  const commitMessage = wfRun.display_title;
  const failedJobs = jobsResponse.jobs.filter(
    (job) => job.status == "completed" && job.conclusion == "failure"
  );
  const failedJobsWithLinks = failedJobs
    .map((job) => `<${job.html_url}|${job.name}>`)
    .join(", ");

  const successEmojis = [
    ":partying_face:",
    ":sunglasses:",
    ":partyparrot:",
    ":heart_hands:",
    ":tada:",
    ":rocket:",
    ":trophy:",
    ":first_place_medal:",
    ":balloon:",
    ":confetti_ball:",
    ":star_struck:",
    ":man_dancing:",
    ":man_in_lotus_position:",
    ":woman_in_lotus_position:",
    ":beers:",
    ":clinking_glasses:",
    ":sunny:",
    ":ribbon:",
    ":crown:",
    ":female_superhero:",
    ":superhero:",
    ":heart_eyes:",
    ":heart_eyes_cat:",
    ":dancer:",
    ":sparkles:",
    ":champagne:",
  ];

  // Create Slack message
  // For debugging: https://app.slack.com/block-kit-builder/
  const slackMessage = {
    // We use attachments to keep the color bar on the left side
    attachments: [
      {
        color: `${
          failedJobs.length == 0
            ? "#5CB589" // Green
            : repositoryName.includes("bouwens")
            ? "#D8232A" // Bouwens' red (for Emiel)
            : "#960018" // Carmine red
        }`,
        blocks: [
          // Author
          {
            type: "context",
            elements: [
              {
                type: "image",
                image_url: avatarUrl,
                alt_text: commitAuthor.includes("emiel")
                  ? "Just Emiel..."
                  : "Cute cat",
              },
              {
                type: "mrkdwn",
                text: "*" + commitAuthor + "*",
              },
            ],
          },
          // Repository + branch
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*${repositoryName}* (<${branchUrl}|${branchName}>)`,
            },
          },
          // Commit
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `${commitMessage} (<${commitUrl}|${commitSha.slice(
                0,
                7
              )}>)`,
            },
          },
          // Failled jobs (if any)
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text:
                failedJobs.length == 0
                  ? `All jobs succeeded ${
                      successEmojis[
                        Math.floor(Math.random() * successEmojis.length)
                      ]
                    }`
                  : `*Failed job${
                      failedJobs.length > 1 ? "s" : ""
                    }:* ${failedJobsWithLinks}`,
            },
          },
        ],
      },
    ],
  };

  // For debugging on Slack Block Kit Builder:
  // console.log("Slack message: ", JSON.stringify(slackMessage));

  // Send message to Slack
  await new IncomingWebhook(slackWebhook).send(slackMessage);
}

run().catch((error) => {
  core.setFailed(error.message);
  console.error(error.stack);
});
