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

  console.log(jobsResponse)
  const completedJobs = jobsResponse.jobs.filter(job => job.status == "completed")

  const successfulJobs = completedJobs.filter(job => job.conclusion == "success")
  const skippedJobs = completedJobs.filter(job => job.conclusion == "skipped")
  const failedJobs = completedJobs.filter(job => job.conclusion == "failure")
  const cancelledJobs = completedJobs.filter(job => job.conclusion == "cancelled")

  const jobsWithLink = jobs => jobs.map(job => `<${job.html_url}|${job.name}>`).join(", ")

  const sections = []

  if (failedJobs.length > 0) {
    sections.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Failed:* ${jobsWithLink(failedJobs)}`,
      },
    })
  }

  if (cancelledJobs.length > 0) {
    sections.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*Cancelled:* ${jobsWithLink(cancelledJobs)}`,
      },
    })
  }

  if (successfulJobs.length > 0 && failedJobs.length == 0 && cancelledJobs.length == 0) {
    const skipped = skippedJobs.length > 0 ? ` (${skippedJobs.length} skipped)` : ""

    sections.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `All jobs succeeded${skipped} ${fetchEmoji(project)}`,
      },
    })
  }

  const status = failedJobs.length > 0 ? "failed" : cancelledJobs.length > 0 ? "cancelled" : successfulJobs.length > 0 ? "success" : undefined

  // Everything was skipped; don't bother mentioning it.
  if (status === undefined) return

  // Create Slack message
  // For debugging: https://app.slack.com/block-kit-builder/
  const slackMessage = {
    // We use attachments to keep the color bar on the left side
    attachments: [
      {
        fallback: `${statusMoji[status]} ${project} (${branchName}) - ${commitAuthor}: ${commitMessage}`,
        color: statusColor[status],
        blocks: [
          // Author
          {
            type: "context",
            elements: [
              {
                type: "image",
                image_url: avatarUrl,
                alt_text: "Cute cat",
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
          ...sections,
        ],
      },
    ],
  };

  // For debugging on Slack Block Kit Builder:
  // console.log("Slack message: ", JSON.stringify(slackMessage));

  // Send message to Slack
  await new IncomingWebhook(slackWebhook).send(slackMessage);
}

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
  ]

  const today = new Date();
  const xmasStart = new Date(today.getFullYear(), 11, 19);
  const xmasEnd = new Date(today.getFullYear(), 11, 26);
  if (today > xmasStart && today < xmasEnd) {
    return xmasEmojis[Math.floor(Math.random() * xmasEmojis.length)]
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
  ]

  const customer = project.split("-")[0]

  switch (customer) {
    case "dienst":
    case "omron":
      successEmojis.push(":happy_mattijs:");
      successEmojis.push(":happy_mattijs:");
      break;
    case "pgs":
      successEmojis.push(":happy_bouke:");
      successEmojis.push(":happy_bouke:");
      break;
    case "taxology":
      successEmojis.push(":happy_rolf:");
      successEmojis.push(":happy_rolf:");
      break;
  }

  return successEmojis[Math.floor(Math.random() * successEmojis.length)];
}

const statusMoji = {
  failed: "❌",
  cancelled: "🚫",
  success: "✅",
}

const statusColor = {
  failed: "#960018",
  cancelled: "#A9A9A9",
  success: "#5CB589",
}

run().catch((error) => {
  core.setFailed(error.message);
  console.error(error.stack);
});
