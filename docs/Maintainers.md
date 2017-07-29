---
id: maintainers
title: What to Expect from Maintainers
layout: docs
category: Contributing
permalink: docs/maintainers.html
next: understanding-cli
previous: testing
---

So you have read through the [contributor's guide](docs/contributing.html) and you're getting ready to send your first pull request. Perhaps you've found an issue in React Native and want to work with the maintainers to land a fix. Here's what you can expect to happen when you open an issue or send a pull request.

> The following is adapted from the excellent [Open Source Guide](https://opensource.guide/) from GitHub and reflects how the maintainers of React Native are encouraged to handle your contributions.

## Handling Issues

We see dozens of new issues being created every day. In order to help maintainers focus on what is actionable, maintainers ask contributors to do a bit of work prior to opening a new issue:

* New issues should follow the [Issue Template](https://github.com/facebook/react-native/blob/master/.github/ISSUE_TEMPLATE.md).
* Issues should provide clear, easy to follow steps alongside sample code to reproduce the issue. Ideally, provide a [Snack](http://snack.expo.io/).

Issues that do not  meet the above criteria can be closed immediately, with a link to the [contributor's guide](docs/contributing.html).

### Issues should be reproducible

Issues should be relatively easy to reproduce. Sometimes the issue affects a particular app but a minimal repro is not provided, perhaps a crash is seen in the logs and the author is not sure where its coming from, maybe the issue is sporadic.

As it happens, if a maintainer cannot easily reproduce the issue, one cannot reasonably expect them to be able to work on a fix. These issues can be closed with a short explanation why.

Exceptions can be made if multiple people appear to be affected by the issue, especially right after a new React Native release is cut.

### New issue runbook

You have gathered all the information required to open a new issue, and you are confident it meets the [contributor guidelines](docs/contributing.html). Once you post an issue, this is what our maintainers will consider when deciding how to move forward:

1. Is this issue a feature request? If so, they will ask you to use Canny for feature requests by issuing the `@facebook-github-bot feature` command, closing the issue.
2. Is this issue a request for help? If so, the maintainer will encourage you to ask on Stack Overflow by issuing the `@facebook-github-bot stack-overflow` command, closing the issue.
3. Was the [Issue Template](https://github.com/facebook/react-native/blob/master/.github/ISSUE_TEMPLATE.md) used to fill out the issue? Did the author answer Yes to both questions at the top? If not, the maintainer will ask you to provide more information by issuing the `@facebook-github-bot no-template` command, closing the issue.
4. Does the issue include a Snack or list of steps to reproduce the issue? If not, a maintainer will ask for a repro by issuing the `@facebook-github-bot needs-repro` command.
5. Can the issue be reliably reproduced? If not, a maintainer may issue the `@facebook-github-bot cannot-repro` command, closing the issue.
6. Is the issue for an old release of React Native? If so, expect to be asked if the issue can be reproduced in the latest release candidate.

You can learn more about how GitHub Bot commands are used [here](docs/maintainers.html#facebook-github-bot).

### Triaging issues

If a issue is still open after going through all of the checks above, it will move on to the triage stage. A maintainer will then do the following:

1. Add relevant labels: iOS, Android, Tooling, Documentation. They will do so by issuing the `@facebook-github-bot label` command.
2. Leave a comment saying the issue has been triaged.
3. Tag the relevant people.

For example, if a issue describes something that needs to be addressed before the next release is cut, a maintainer may tag @grabbou. If the issue concerns Animated, they may tag @janicduplessis. If this is a docs issue, they may tag @hramos. You can generally figure out who is interested in what sort of issue by looking at the [CODEOWNERS](https://github.com/facebook/react-native/blob/master/.github/CODEOWNERS) file.

### Stale issues

Issues that have been open for over six months and have had no activity in the last two months may be closed periodically. If your issue gets closed in this manner, it's nothing personal. If you strongly believe that the issue should remain open, just let us know why.

Simply commenting that the issue still exists is not very compelling (it's rare for critical, release blocking issues to have no activity for two months!). In order to make a good case for reopening the issue, you may need to do a bit of work:

* Can the issue be reproduced on the latest release candidate? Post a comment with the version you tested.
* If so, is there any information missing from the bug report? Post a comment with all the information required by the [issue template](https://github.com/facebook/react-native/blob/master/.github/ISSUE_TEMPLATE.md).
* Is there a pull request that addressed this issue? Post a comment with the PR number so we can follow up.

A couple of contributors making a good case may be all that is needed to reopen the issue.


## Handling pull requests

The core team will be monitoring for pull requests. When we get one, we'll run some Facebook-specific integration tests on it first. From here, we'll need to get another person to sign off on the changes and then merge the pull request. For API changes we may need to fix internal uses, which could cause some delay. We'll do our best to provide updates and feedback throughout the process.

### How we prioritize pull requests

We use the [Contributors Chrome extension](https://github.com/hzoo/contributors-on-github) to help us understand who is sending a pull request. Pull requests opened by contributors that have a history of having their PRs merged are more likely to be looked at first. Aside from that, we try to go through pull requests on a chronological order.

### How we review pull requests

Reviewing a PR can sometimes require more time from a maintainer than it took you to write the code. Maintainers need to consider all the ramifications of importing your patch into the codebase. Does it potentially introduce breaking changes? What are the performance considerations of adding a new dependency? Will the docs need to be updated as well? Does this belong in core, or would it be a better fit as a third party package?

Finding the right person to review a pull request can sometimes be tricky. A pull request may simultaneously touch iOS, Java, and JavaScript code. If a pull request has been waiting for review for a while, you can help out by looking at the blame history for the files you're touching. Is there anyone that appears to be knowledgeable in the part of the codebase the PR is touching?

### Closing pull requests

Sometimes a maintainer may decide that a pull request will not be accepted. Maybe the pull request is out of scope for the project, or the idea is good but the implementation is poor. Whatever the reason, when closing a pull request maintainers should keep the conversation friendly:

* **Thank** them for their contribution.
* **Explain why** it doesn't fit into the scope of the project.
* **Link to relevant documentation**, if you have it.
* **Close** the request.

## Defusing situations

Sometimes when a maintainer says no to a pull request or close an issue, a contributor may get upset and criticize your decision. Maintainers will take steps to defuse the situation.

If a contributor becomes hostile or disrespectful, they will be referred to the [Code of Conduct](https://code.facebook.com/codeofconduct). Negative users will be blocked, and inappropriate comments will be deleted.

## Facebook GitHub Bot

The Facebook GitHub Bot allows certain active members of the community to perform administrative actions such as labeling and closing issues. The list of community members with this kind of access can be found at the top of the [IssueCommands.txt](https://github.com/facebook/react-native/blob/master/bots/IssueCommands.txt) file in the repository.

Once you have become an active contributor in the community, you may open a pull request to add yourself to the list, making sure to list your prior contributions to the community when doing so.

### Using the Facebook GitHub Bot

The bot can be triggered by adding any of the following commands as a standalone comment on an issue:

<div class="botActions">
  <div class="botAction">
    <h4 class="botCommand">
      <span class="botMentionName">@facebook-github-bot</span> no-template
    </h4>
    <div><p>
      Use this when more information is needed, especially if the issue does not adhere to the <a href="https://raw.githubusercontent.com/facebook/react-native/master/.github/ISSUE_TEMPLATE.md">issue template</a>. The bot will <strong>close</strong> the issue after adding the "Needs more information" label.
    </p></div>
  </div>
  <div class="botAction">
    <h4 class="botCommand">
      <span class="botMentionName">@facebook-github-bot</span> stack-overflow
    </h4>
    <div><p>
      Mark issues that do not belong in the bug tracker, and redirect to Stack Overflow. The bot will <strong>close</strong> the issue after adding the "For Stack Overflow" label.
    </p></div>
  </div>
  <div class="botAction">
    <h4 class="botCommand">
      <span class="botMentionName">@facebook-github-bot</span> needs-repro
    </h4>
    <div><p>
      Prompts the author to provide a reproducible example or <a href="http://snack.expo.io">Snack</a>. The bot will apply the "Needs more information" label.
    </p></div>
  </div>
  <div class="botAction">
    <h4 class="botCommand">
      <span class="botMentionName">@facebook-github-bot</span> cannot-repro
    </h4>
    <div><p>
      Use this when the issue cannot be reproduced, either because it affects a particular app but no minimal repro was provided, or the issue describes something sporadic that is unlikely to be reproduced by a community member. The bot will <strong>close</strong> the issue.
    </p></div>
  </div>
  <div class="botAction">
    <h4 class="botCommand">
      <span class="botMentionName">@facebook-github-bot</span> duplicate (#[0-9]+)
    </h4>
    <div><p>
      Marks an issue as a duplicate. Requires a issue number to be provided. The bot will <strong>close</strong> the issue.
    </p>
    <p>
      Example: <code>@facebook-github-bot duplicate #42</code>
    </p></div>
  </div>
  <div class="botAction">
    <h4 class="botCommand">
      <span class="botMentionName">@facebook-github-bot</span> label (.*)
    </h4>
    <div><p>
      Use this command to add a <a href="https://github.com/facebook/react-native/labels">label</a>, such as "iOS" or "Android", to an issue.
    </p><p>
      Example: <code>@facebook-github-bot label Android</code>
    </p></div>
  </div>
  <div class="botAction">
    <h4 class="botCommand">
      <span class="botMentionName">@facebook-github-bot</span> feature
    </h4>
    <div><p>
      Use this when an issue describes a feature request, as opposed to a reproducible bug. The bot will point the author to the feature request tracker, add the "Feature Request" label, then <strong>close</strong> the issue.
    </p></div>
  </div>
  <div class="botAction">
    <h4 class="botCommand">
      <span class="botMentionName">@facebook-github-bot</span> expected
    </h4>
    <div><p>
      Use this when an issue describes a type of expected behavior. The bot will <strong>close</strong> the issue.
    </p></div>
  </div>
  <div class="botAction">
    <h4 class="botCommand">
      <span class="botMentionName">@facebook-github-bot</span> answered
    </h4>
    <div><p>
      Use this when an issue appears to be a question that has already been answered by someone on the thread. The bot will <strong>close</strong> the issue.
    </p></div>
  </div>
  <div class="botAction">
    <h4 class="botCommand">
      <span class="botMentionName">@facebook-github-bot</span> close
    </h4>
    <div><p>
      <strong>Closes</strong> an issue without providing a particular explanation.
    </p></div>
  </div>
  <div class="botAction">
    <h4 class="botCommand">
      <span class="botMentionName">@facebook-github-bot</span> reopen
    </h4>
    <div><p>
      <strong>Re-opens</strong> a previously closed issue.
    </p></div>
  </div>
  <div class="botAction">
    <h4 class="botCommand">
      <span class="botMentionName">@facebook-github-bot</span> bugfix
    </h4>
    <div><p>
      Mark issues that describe a reproducible bug and encourage the author to send a pull request. The bot will add the "Help Wanted" label.
    </p></div>
  </div>
  <div class="botAction">
    <h4 class="botCommand">
      <span class="botMentionName">@facebook-github-bot</span> no-reply
    </h4>
    <div><p>
      Use this when an issue requires more information from the author but they have not added a comment in a while. The bot will <strong>close</strong> the issue.
    </p></div>
  </div>
  <div class="botAction">
    <h4 class="botCommand">
      <span class="botMentionName">@facebook-github-bot</span> icebox
    </h4>
    <div><p>
      Use this when an issue has been open for over 30 days with no activity and no community member has volunteered to work on a fix. The bot will <strong>close</strong> the issue after adding the "Icebox" label.
    </p></div>
  </div>
</div>

Additionally, the following commands can be used on a pull request:

<div class="botActions">
  <div class="botAction">
    <h4 class="botCommand">
      <span class="botMentionName">@facebook-github-bot</span> cla
    </h4>
    <div><p>
      Remind the author that the CLA needs to be signed.
    </p></div>
  </div>
  <div class="botAction">
    <h4 class="botCommand">
      <span class="botMentionName">@facebook-github-bot</span> shipit
    </h4>
    <div><p>
      Flag the PR for merging. If used by a core contributor, the bot will attempt to import the pull request. In general, core contributors are those who have consistently submitted high quality contributions to the project. Access control for this command is configured internally in Facebook, outside of the IssueCommands.txt file mentioned above.
    </p></div>
  </div>
</div>
