const core = require("@actions/core");
const github = require("@actions/github");

try {
  // const [repoOwner, repo] = getInput("repo").split("/");
  // const wfRunId = getInput("run-id");
  const slackWebhook = core.getInput("slack-webhook");

  console.log("Core: ", core);
  console.log("Github: ", github);

  // Parse workflow run data
  const commitAuthor = github.context.actor;
  const avatarUrl = github.context.payload.sender.avatar_url;
  const repositoryUrl = github.context.payload.repository.url;
  const repositoryName = github.context.payload.repository.full_name;
  const branchName = github.context.ref.split("/").pop();
  const branchUrl = repositoryUrl + "/tree/" + branchName;
  const commitSha = github.context.sha;
  const commitUrl = repositoryUrl + "/commit/" + commitSha;
  const commitMessage = github.context.payload.head_commit.message;

  console.log("------------------");
  console.log("Commit Author: ", commitAuthor);
  console.log("Avatar URL: ", avatarUrl);
  console.log("Repository URL: ", repositoryUrl);
  console.log("Repository Name: ", repositoryName);
  console.log("Branch Name: ", branchName);
  console.log("Branch URL: ", branchUrl);
  console.log("Commit SHA: ", commitSha);
  console.log("Commit URL: ", commitUrl);
  console.log("Commit Message: ", commitMessage);

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
} catch (error) {
  core.setFailed(error.message);
  console.log(error.message);
}
