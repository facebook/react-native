---
id: maintainers
title: What to Expect from Maintainers
layout: docs
category: Contributing
permalink: docs/maintainers.html
next: testing
previous: contributing
---

So you have read through the [contributor's guide](docs/contributing.html) and you're getting ready to send your first pull request. Perhaps you've found an issue in React Native and want to work with the maintainers to land a fix. Here's what you can expect to happen when you open an issue or send a pull request.

> The following is adapted from the excellent [Open Source Guide](https://opensource.guide/) from GitHub and reflects how the maintainers of React Native are encouraged to handle your contributions.

## Handling Issues

We see dozens of new issues being created every day. In order to help maintainers focus on what is actionable, maintainers ask contributors to do a bit of work prior to opening a new issue:

* New issues should follow the [Issue Template](https://github.com/facebook/react-native/blob/master/.github/ISSUE_TEMPLATE.md).
* Issues should provide clear, easy to follow steps alongside sample code to reproduce the issue. Ideally, provide a [Snack](http://snack.expo.io/).

Issues that do not meet the above criteria can be closed immediately, with a link to the [contributor's guide](docs/contributing.html).

### New issue runbook

You have gathered all the information required to open a new issue, and you are confident it meets the [contributor guidelines](docs/contributing.html). Once you post an issue, this is what our maintainers will consider when deciding how to move forward:

* **Is this issue a feature request?** 

  Some features may not be a good fit for the core React Native library. This is usually the case for **new modules* that Facebook does not use in production. In this case, a maintainer will explain that this should be released to npm as a separate module, allowing users to easily pull in the module in their projects.

  Even if the feature does belong in the core library, adding it means maintaining it. A maintainer will encourage you to submit a pull request or otherwise post your request to [Canny](https://react-native.canny.io/feature-requests) by issuing the `@facebook-github-bot feature` command, closing the issue.

  An exception can be made for proposals and long-running discussions, though these should be rare. If you have been contributing to the project long enough, you will probably already have access to the [React Native Core Contributors](https://www.facebook.com/groups/reactnativeoss/) Facebook Group, where this sort of discussion is usually held.

* **Is this issue a request for help?** 

  Questions should absolutely be asked on Stack Overflow rather than GitHub. Maintainers may encourage you to ask on Stack Overflow by issuing the `@facebook-github-bot stack-overflow` command, closing the issue.
  Feel free to also answer some [questions on Stack Overflow](stackoverflow.com/questions/tagged/react-native), you'll get rep!

* **Was the [Issue Template](https://github.com/facebook/react-native/blob/master/.github/ISSUE_TEMPLATE.md) used to fill out the issue? Did the author answer Yes to both questions at the top?** 

  If not, the maintainer will ask you to provide more information by issuing the `@facebook-github-bot no-template` command, closing the issue.

* **Is the issue a duplicate of an existing, open issue?**

  A maintainer will use the `@facebook-github-bot duplicate #123` command to mark the issue as a duplicate of issue #123, closing it.
  
* **Does the issue include a Snack or list of steps to reproduce the issue?** 

  Issues should be relatively easy to reproduce. Sometimes the issue affects a particular app but a minimal repro is not provided, perhaps a crash is seen in the logs and the author is not sure where its coming from, maybe the issue is sporadic.

  As it happens, if a maintainer cannot easily reproduce the issue, one cannot reasonably expect them to be able to work on a fix. These issues can be closed by issuing the `@facebook-github-bot needs-repro` command.

  Exceptions can be made if multiple people appear to be affected by the issue, especially right after a new React Native release is cut.

* **Is the issue for an old release of React Native?** 

  If so, expect to be asked if the issue can be reproduced in the latest release candidate.

* **Can the issue be reliably reproduced?** 

  If not, a maintainer may issue the `@facebook-github-bot cannot-repro` command, closing the issue.

* **Does the issue need more information?**

  Some issues need additional information in order to reproduce them. Maintainers should explain what additional information is needed, using the `@facebook-github-bot label Needs more information` command to label the issue as such. 

  Issues with the 'Needs more information' label that have been open for more than a week without a response from the author can be closed using `@facebook-github-bot no-reply`.

* **Has the issue been resolved already in the comments?**

  Sometimes another contributor has already provided a solution in the comments. Maintainers may issue the `@facebook-github-bot answered` command to close the issue.

> **Reopening a closed issue:** Sometimes it's necessary to reopen an issue. For example, if an issue was closed waiting for the author, then the author replied and it turns out this is indeed a bug, you can comment `@facebook-github-bot reopen` to reopen it.

Valid bug reports with good repro steps are some of the best issues! Maintainers should thank the author for finding the issue, then explain that React Native is a community project and **ask them if they would be up for sending a fix**.

### Triaging issues

If a issue is still open after going through all of the checks above, it will move on to the triage stage. A maintainer will then do the following:

1. Add relevant labels. For example, if this is an issue that affects Android, use the `@facebook-github-bot label Android` command.
2. Leave a comment saying the issue has been triaged.
3. Tag the relevant people.

You can generally figure out who may be relevant for a given issue by looking at the [CODEOWNERS](https://github.com/facebook/react-native/blob/master/.github/CODEOWNERS) file.

#### What are all the available commands for the bot?

You can find the full command reference in the [Facebook GitHub Bot](/docs/maintainers.html#facebook-github-bot) section below. 

### Stale issues

Issues in the "Needs more information" state may be closed after a week with no followup from the author. Issues that have have had no activity in the last two months may be closed periodically. If your issue gets closed in this manner, it's nothing personal. If you strongly believe that the issue should remain open, just let us know why.

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

Once you open a pull request, this is how you can expect maintainers to review it:

* **Is the pull request missing information?**

  A test plan is required! Add the labels 'Needs revision' and 'Needs response from author'. You can then follow up with a response like:

  > Hey @author, thanks for sending the pull request.
  > Can you please add all the info specified in the [template](https://github.com/facebook/react-native/blob/master/.github/PULL_REQUEST_TEMPLATE.md)? This is necessary for people to be able to understand and review your pull request.

* **Does the code style match the [Style guide](docs/contributing.html#style-guide)?**

  If not, link to the style guide and add the label 'Needs revision'.

* **Does the pull request add a completely new feature we don't want to add to the core and maintain?**

  Ask the author to release it a separate npm module and close the pull request.

* **Does the pull request do several unrelated things at the same time?**

  Ask the author to split it.

* **Is the pull request old and need rebasing?**

  Ask the author "Can you rebase please?" and add the label 'Needs response from author'.

* **Is a pull request waiting for a response from author?**

  Pull requests like these usually have the label 'Needs response from author'. If there has been no reply in the last 30 days, close it with a response like the following:

  > Thanks for making the pull request, but we are closing it due to inactivity. If you want to get your proposed changes merged, please rebase your branch with master and send a new pull request.

* **Is the pull request old and waiting for review?**

  Review it or cc someone who might be able to review. Finding the right person to review a pull request can sometimes be tricky. A pull request may simultaneously touch iOS, Java, and JavaScript code. If a pull request has been waiting for review for a while, you can help out by looking at the blame history for the files you're touching. Is there anyone that appears to be knowledgeable in the part of the codebase the PR is touching?

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

The Facebook GitHub Bot allows members of the community to perform administrative actions such as labeling and closing issues. 
To have access to the bot, please add your GitHub username to the first line of [IssueCommands.txt](https://github.com/facebook/react-native/blob/master/bots/IssueCommands.txt), in alphabetical order, by submitting a Pull Request.

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
  <div class="botAction">
    <h4 class="botCommand">
      <span class="botMentionName">@facebook-github-bot</span> large-pr
    </h4>
    <div><p>
      Flag PRs that change too many files at once. These PRs are extremely unlikely to be reviewed. The bot will leave a helpful message indicating next steps such as splitting the PR. The bot will <strong>close</strong> the PR after adding the "Large PR" label.
    </p></div>
  </div>
</div>
