# Voormedia's Slack-notification Github Action

When triggered, this Github action automatically sends a Slack message with the conclusions
(success or fail) of the other completed jobs in the same workflow.

## Instructions for use

Add the folowing job to your Github Action workflow:

```
slack-notification:
  runs-on: ubuntu-latest #self-hosted
  needs: [<ALL_OTHER_JOBS>]
  if: ${{ always() }}
  steps:
    - name: Notify on Slack
      uses: voormedia/ci-slack-notification@main
      with:
        token: ${{ secrets.GH_CLONE_TOKEN }}
        slack-webhook: ${{ secrets.SLACK_WEBHOOK }}
```

SLACK_WEBHOOK is currently bound to the #CI channel. In case you want to post to a different channel,
you can create a new Slack webhook, add it as an <https://github.com/organizations/voormedia/settings/secrets/actions> in Github and use its name instead of "SLACK_WEBHOOK".

## Instructions for editing

The actions interface is defined in `action.yml`. There you can add/remove/edit arguments (`input`),
for example.

The action itself is defined in `index.js`. It uses a Github octokit to retrieve repository, workflows
& jobs data and structures this data into a Slack message, using Slack's <https://api.slack.com/reference/block-kit|Block Kit>.

### /!\ Compile before pushing /!\

Github doesn't like when we push node modules separately from index.js, so we better compile
everything in a single distribution file. For that, before pushing to the repo we have to run:

`npm run build`
