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
  const project = wfRun.repository.full_name.split("/")[1];
  const branchName = wfRun.head_branch;
  const branchUrl = repositoryUrl + "/tree/" + branchName;
  const commitSha = wfRun.head_sha;
  const shortCommit = commitSha.slice(0, 7);
  const commitUrl = repositoryUrl + "/commit/" + commitSha;
  const commitMessage = wfRun.display_title;
  const failedJobs = jobsResponse.jobs.filter(
    (job) => job.status == "completed" && job.conclusion == "failure"
  );
  const failedJobsWithLinks = failedJobs
    .map((job) => `<${job.html_url}|${job.name}>`)
    .join(", ");

  const fetchEmoji = (project) => {
    const xmasEmojis = [
      ":christmas_tree:",
      ":gift:",
      ":santa:",
      ":mrs_claus:",
      ":snowman:",
      ":snowflake:",
      ":bell:",
      ":star:",
      ":santa_bas:",
      ":santa_bouke:",
      ":santa_mattijs:",
      ":santa_rolf:",
      ":xmas_emiel:",
    ];

    const today = new Date();
    const xmasStart = new Date(today.getFullYear(), 11, 19);
    const xmasEnd = new Date(today.getFullYear(), 11, 26);
    if (today > xmasStart && today < xmasEnd) {
      return xmasEmojis[Math.floor(Math.random() * xmasEmojis.length)];
    }

    const successEmojis = [
      ":partying_face:",
      ":partyparrot:",
      ":tada:",
      ":rocket:",
      ":trophy:",
      ":first_place_medal:",
      ":balloon:",
      ":confetti_ball:",
      ":man_dancing:",
      ":man_in_lotus_position:",
      ":woman_in_lotus_position:",
      ":beers:",
      ":clinking_glasses:",
      ":sunny:",
      ":crown:",
      ":female_superhero:",
      ":superhero:",
      ":dancer:",
      ":mario_luigi_dance:",
      ":champagne:",
    ];

    const customer = project.split("-")[0];

    switch (customer) {
      case "alpacards":
        successEmojis.push(":happy_bas:");
        successEmojis.push(":happy_bas:");
        successEmojis.push(":happy_bas:");
        break;
      case "bouwens":
        successEmojis.push(":happy_emiel:");
        successEmojis.push(":happy_emiel:");
        successEmojis.push(":happy_emiel:");
        break;
      case "dienst":
      case "omron":
        successEmojis.push(":happy_emiel:");
        successEmojis.push(":happy_mattijs:");
        successEmojis.push(":happy_mattijs:");
        break;
      case "pgs":
        successEmojis.push(":happy_bas:");
        successEmojis.push(":happy_rolf:");
        break;
      case "tiny":
        successEmojis.push(":happy_bouke:");
        successEmojis.push(":happy_rolf:");
        break;
      case "taxology":
        successEmojis.push(":happy_rolf:");
        successEmojis.push(":happy_rolf:");
        break;
    }

    return successEmojis[Math.floor(Math.random() * successEmojis.length)];
  };

  // Create Slack message
  // For debugging: https://app.slack.com/block-kit-builder/
  const slackMessage = {
    // We use attachments to keep the color bar on the left side
    attachments: [
      {
        fallback: `${failedJobs.length == 0 ? "✅" : "❌"} ${project} (${branchName}) - ${commitAuthor}: ${commitMessage}`,
        color: `${
          failedJobs.length == 0
            ? "#5CB589" // Green
            : project.includes("bouwens")
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
          // Repository + branch + commit
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*${project}* (<${branchUrl}|${branchName}>)\n${commitMessage} (<${commitUrl}|${shortCommit}>)`,
            },
          },
          // Failled jobs (if any)
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text:
                failedJobs.length == 0
                  ? `All jobs succeeded ${fetchEmoji(project)}`
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
