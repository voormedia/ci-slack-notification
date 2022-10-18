const core = require("@actions/core");
// const github = require("@actions/github"); // Not sure if we need this if using API
const { Octokit } = require("@octokit/core");

async function run() {
  const token = core.getInput("token");
  const [repoOwner, repo] = core.getInput("repo").split("/");
  const wfRunId = core.getInput("run-id");
  const slackWebhook = core.getInput("slack-webhook");

  const wfRunUrl = `/repos/${repoOwner}/${repo}/actions/runs/${wfRunId}`;

  const octokit = new Octokit({ auth: token });

  // Use Github API to fetch workflow run & jobs data
  const wfRun = await octokit.request(`GET ${wfRunUrl}`);
  const jobsResponse = await octokit.request(`GET ${wfRunUrl}/jobs`);

  console.log(wfRun);
  console.log(jobsResponse);

  // const commitAuthor = wfRun.data.actor.login;
  // const avatarUrl = wfRun.data.actor.avatar_url;
  // const repositoryUrl = wfRun.data.repository.html_url;
  // const repositoryName = wfRun.data.repository.full_name;
  // const branchName = wfRun.data.head_branch;
  // const branchUrl = repositoryUrl + "/tree/" + branchName;
  // const commitSha = wfRun.data.head_sha;
  // const commitUrl = repositoryUrl + "/commit/" + commitSha;
  // const commitMessage = wfRun.data.display_title;
  // const failedJobs = jobsResponse.data.jobs.filter(
  //   (job) => job.status == "completed" && job.conclusion == "failure"
  // );
  // const failedJobsWithLinks = failedJobs
  //   .map((job) => `<${job.html_url}|${job.name}>`)
  //   .join(", ");

  // const slackMessage = {
  //   attachments: [
  //     {
  //       color: `${failedJobs.length == 0 ? "#36a64f" : "#8B0000"}`,
  //       blocks: [
  //         {
  //           type: "context",
  //           elements: [
  //             {
  //               type: "image",
  //               image_url: avatarUrl,
  //               alt_text: "cute cat",
  //             },
  //             {
  //               type: "mrkdwn",
  //               text: "*" + commitAuthor + "*",
  //             },
  //           ],
  //         },
  //         {
  //           type: "section",
  //           text: {
  //             type: "mrkdwn",
  //             text: `<${repositoryUrl}|*${repositoryName}*>`,
  //           },
  //         },
  //         {
  //           type: "section",
  //           text: {
  //             type: "mrkdwn",
  //             text: `*Branch:* <${branchUrl}|${branchName}>`,
  //           },
  //         },
  //         {
  //           type: "section",
  //           text: {
  //             type: "mrkdwn",
  //             text: `*Commit:* ${commitMessage} (<${commitUrl}|${commitSha}>)`,
  //           },
  //         },
  //         {
  //           type: "section",
  //           text: {
  //             type: "mrkdwn",
  //             text:
  //               failedJobs.length == 0
  //                 ? "All tests passed :rocket:"
  //                 : `*Failed job${
  //                     failedJobs.length > 1 ? "s" : ""
  //                   }:* ${failedJobsWithLinks}`,
  //           },
  //         },
  //       ],
  //     },
  //   ],
  // };

  // // For testing on Slack Block Kit Builder:
  // console.log("Slack message: ", JSON.stringify(slackMessage));

  // // Send message to Slack
  // var xhr = new XMLHttpRequest();
  // xhr.open("POST", slackWebhook, true);
  // xhr.setRequestHeader("Content-Type", "application/json");
  // xhr.send(JSON.stringify(slackMessage));
}

run().catch((error) => core.setFailed(error.message));
