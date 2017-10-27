---
id: version-0.50-maintainers
title: maintainers
original_id: maintainers
---
<a id="content"></a><h1><a class="anchor" name="what-to-expect-from-maintainers"></a>What to Expect from Maintainers <a class="hash-link" href="docs/maintainers.html#what-to-expect-from-maintainers">#</a></h1><div><p>So you have read through the <a href="docs/contributing.html" target="_blank">contributor's guide</a> and you're getting ready to send your first pull request. Perhaps you've found an issue in React Native and want to work with the maintainers to land a fix. Here's what you can expect to happen when you open an issue or send a pull request.</p><blockquote><p>The following is adapted from the excellent <a href="https://opensource.guide/" target="_blank">Open Source Guide</a> from GitHub and reflects how the maintainers of React Native are encouraged to handle your contributions.</p></blockquote><h2><a class="anchor" name="handling-issues"></a>Handling Issues <a class="hash-link" href="docs/maintainers.html#handling-issues">#</a></h2><p>We see dozens of new issues being created every day. In order to help maintainers focus on what is actionable, maintainers ask contributors to do a bit of work prior to opening a new issue:</p><ul><li>New issues should follow the <a href="https://github.com/facebook/react-native/blob/master/.github/ISSUE_TEMPLATE.md" target="_blank">Issue Template</a>.</li><li>Issues should provide clear, easy to follow steps alongside sample code to reproduce the issue. Ideally, provide a <a href="http://snack.expo.io/" target="_blank">Snack</a>.</li></ul><p>Issues that do not meet the above criteria can be closed immediately, with a link to the <a href="docs/contributing.html" target="_blank">contributor's guide</a>.</p><h3><a class="anchor" name="new-issue-runbook"></a>New issue runbook <a class="hash-link" href="docs/maintainers.html#new-issue-runbook">#</a></h3><p>You have gathered all the information required to open a new issue, and you are confident it meets the <a href="docs/contributing.html" target="_blank">contributor guidelines</a>. Once you post an issue, this is what our maintainers will consider when deciding how to move forward:</p><ul><li><p><strong>Is this issue a feature request?</strong> </p><p>Some features may not be a good fit for the core React Native library. This is usually the case for <em>*new modules</em> that Facebook does not use in production. In this case, a maintainer will explain that this should be released to npm as a separate module, allowing users to easily pull in the module in their projects.</p><p>Even if the feature does belong in the core library, adding it means maintaining it. A maintainer will encourage you to submit a pull request or otherwise post your request to <a href="https://react-native.canny.io/feature-requests" target="_blank">Canny</a> by issuing the <code>@facebook-github-bot feature</code> command, closing the issue.</p><p>An exception can be made for proposals and long-running discussions, though these should be rare. If you have been contributing to the project long enough, you will probably already have access to the <a href="https://www.facebook.com/groups/reactnativeoss/" target="_blank">React Native Core Contributors</a> Facebook Group, where this sort of discussion is usually held.</p></li><li><p><strong>Is this issue a request for help?</strong> </p><p>Questions should absolutely be asked on Stack Overflow rather than GitHub. Maintainers may encourage you to ask on Stack Overflow by issuing the <code>@facebook-github-bot stack-overflow</code> command, closing the issue.
Feel free to also answer some <a href="stackoverflow.com/questions/tagged/react-native" target="_blank">questions on Stack Overflow</a>, you'll get rep!</p></li><li><p><strong>Was the <a href="https://github.com/facebook/react-native/blob/master/.github/ISSUE_TEMPLATE.md" target="_blank">Issue Template</a> used to fill out the issue? Did the author answer Yes to both questions at the top?</strong> </p><p>If not, the maintainer will ask you to provide more information by issuing the <code>@facebook-github-bot no-template</code> command, closing the issue.</p></li><li><p><strong>Is the issue a duplicate of an existing, open issue?</strong></p><p>A maintainer will use the <code>@facebook-github-bot duplicate #123</code> command to mark the issue as a duplicate of issue #123, closing it.</p></li><li><p><strong>Does the issue include a Snack or list of steps to reproduce the issue?</strong> </p><p>Issues should be relatively easy to reproduce. Sometimes the issue affects a particular app but a minimal repro is not provided, perhaps a crash is seen in the logs and the author is not sure where its coming from, maybe the issue is sporadic.</p><p>As it happens, if a maintainer cannot easily reproduce the issue, one cannot reasonably expect them to be able to work on a fix. These issues can be closed by issuing the <code>@facebook-github-bot needs-repro</code> command.</p><p>Exceptions can be made if multiple people appear to be affected by the issue, especially right after a new React Native release is cut.</p></li><li><p><strong>Is the issue for an old release of React Native?</strong> </p><p>If so, expect to be asked if the issue can be reproduced in the latest release candidate.</p></li><li><p><strong>Can the issue be reliably reproduced?</strong> </p><p>If not, a maintainer may issue the <code>@facebook-github-bot cannot-repro</code> command, closing the issue.</p></li><li><p><strong>Does the issue need more information?</strong></p><p>Some issues need additional information in order to reproduce them. Maintainers should explain what additional information is needed, using the <code>@facebook-github-bot label Needs more information</code> command to label the issue as such. </p><p>Issues with the 'Needs more information' label that have been open for more than a week without a response from the author can be closed using <code>@facebook-github-bot no-reply</code>.</p></li><li><p><strong>Has the issue been resolved already in the comments?</strong></p><p>Sometimes another contributor has already provided a solution in the comments. Maintainers may issue the <code>@facebook-github-bot answered</code> command to close the issue.</p></li></ul><blockquote><p><strong>Reopening a closed issue:</strong> Sometimes it's necessary to reopen an issue. For example, if an issue was closed waiting for the author, then the author replied and it turns out this is indeed a bug, you can comment <code>@facebook-github-bot reopen</code> to reopen it.</p></blockquote><p>Valid bug reports with good repro steps are some of the best issues! Maintainers should thank the author for finding the issue, then explain that React Native is a community project and <strong>ask them if they would be up for sending a fix</strong>.</p><h3><a class="anchor" name="triaging-issues"></a>Triaging issues <a class="hash-link" href="docs/maintainers.html#triaging-issues">#</a></h3><p>If a issue is still open after going through all of the checks above, it will move on to the triage stage. A maintainer will then do the following:</p><ol><li>Add relevant labels. For example, if this is an issue that affects Android, use the <code>@facebook-github-bot label Android</code> command.</li><li>Leave a comment saying the issue has been triaged.</li><li>Tag the relevant people.</li></ol><p>You can generally figure out who may be relevant for a given issue by looking at the <a href="https://github.com/facebook/react-native/blob/master/.github/CODEOWNERS" target="_blank">CODEOWNERS</a> file.</p><h4><a class="anchor" name="what-are-all-the-available-commands-for-the-bot"></a>What are all the available commands for the bot? <a class="hash-link" href="docs/maintainers.html#what-are-all-the-available-commands-for-the-bot">#</a></h4><p>You can find the full command reference in the <a href="/docs/maintainers.html#facebook-github-bot" target="">Facebook GitHub Bot</a> section below. </p><h3><a class="anchor" name="stale-issues"></a>Stale issues <a class="hash-link" href="docs/maintainers.html#stale-issues">#</a></h3><p>Issues in the "Needs more information" state may be closed after a week with no followup from the author. Issues that have have had no activity in the last two months may be closed periodically. If your issue gets closed in this manner, it's nothing personal. If you strongly believe that the issue should remain open, just let us know why.</p><p>Simply commenting that the issue still exists is not very compelling (it's rare for critical, release blocking issues to have no activity for two months!). In order to make a good case for reopening the issue, you may need to do a bit of work:</p><ul><li>Can the issue be reproduced on the latest release candidate? Post a comment with the version you tested.</li><li>If so, is there any information missing from the bug report? Post a comment with all the information required by the <a href="https://github.com/facebook/react-native/blob/master/.github/ISSUE_TEMPLATE.md" target="_blank">issue template</a>.</li><li>Is there a pull request that addressed this issue? Post a comment with the PR number so we can follow up.</li></ul><p>A couple of contributors making a good case may be all that is needed to reopen the issue.</p><h2><a class="anchor" name="handling-pull-requests"></a>Handling pull requests <a class="hash-link" href="docs/maintainers.html#handling-pull-requests">#</a></h2><p>The core team will be monitoring for pull requests. When we get one, we'll run some Facebook-specific integration tests on it first. From here, we'll need to get another person to sign off on the changes and then merge the pull request. For API changes we may need to fix internal uses, which could cause some delay. We'll do our best to provide updates and feedback throughout the process.</p><h3><a class="anchor" name="how-we-prioritize-pull-requests"></a>How we prioritize pull requests <a class="hash-link" href="docs/maintainers.html#how-we-prioritize-pull-requests">#</a></h3><p>We use the <a href="https://github.com/hzoo/contributors-on-github" target="_blank">Contributors Chrome extension</a> to help us understand who is sending a pull request. Pull requests opened by contributors that have a history of having their PRs merged are more likely to be looked at first. Aside from that, we try to go through pull requests on a chronological order.</p><h3><a class="anchor" name="how-we-review-pull-requests"></a>How we review pull requests <a class="hash-link" href="docs/maintainers.html#how-we-review-pull-requests">#</a></h3><p>Reviewing a PR can sometimes require more time from a maintainer than it took you to write the code. Maintainers need to consider all the ramifications of importing your patch into the codebase. Does it potentially introduce breaking changes? What are the performance considerations of adding a new dependency? Will the docs need to be updated as well? Does this belong in core, or would it be a better fit as a third party package?</p><p>Once you open a pull request, this is how you can expect maintainers to review it:</p><ul><li><p><strong>Is the pull request missing information?</strong></p><p>A test plan is required! Add the labels 'Needs revision' and 'Needs response from author'. You can then follow up with a response like:</p><blockquote><p>Hey @author, thanks for sending the pull request.
Can you please add all the info specified in the <a href="https://github.com/facebook/react-native/blob/master/.github/PULL_REQUEST_TEMPLATE.md" target="_blank">template</a>? This is necessary for people to be able to understand and review your pull request.</p></blockquote></li><li><p><strong>Does the code style match the <a href="docs/contributing.html#style-guide" target="_blank">Style guide</a>?</strong></p><p>If not, link to the style guide and add the label 'Needs revision'.</p></li><li><p><strong>Does the pull request add a completely new feature we don't want to add to the core and maintain?</strong></p><p>Ask the author to release it a separate npm module and close the pull request.</p></li><li><p><strong>Does the pull request do several unrelated things at the same time?</strong></p><p>Ask the author to split it.</p></li><li><p><strong>Is the pull request old and need rebasing?</strong></p><p>Ask the author "Can you rebase please?" and add the label 'Needs response from author'.</p></li><li><p><strong>Is a pull request waiting for a response from author?</strong></p><p>Pull requests like these usually have the label 'Needs response from author'. If there has been no reply in the last 30 days, close it with a response like the following:</p><blockquote><p>Thanks for making the pull request, but we are closing it due to inactivity. If you want to get your proposed changes merged, please rebase your branch with master and send a new pull request.</p></blockquote></li><li><p><strong>Is the pull request old and waiting for review?</strong></p><p>Review it or cc someone who might be able to review. Finding the right person to review a pull request can sometimes be tricky. A pull request may simultaneously touch iOS, Java, and JavaScript code. If a pull request has been waiting for review for a while, you can help out by looking at the blame history for the files you're touching. Is there anyone that appears to be knowledgeable in the part of the codebase the PR is touching?</p></li></ul><h3><a class="anchor" name="closing-pull-requests"></a>Closing pull requests <a class="hash-link" href="docs/maintainers.html#closing-pull-requests">#</a></h3><p>Sometimes a maintainer may decide that a pull request will not be accepted. Maybe the pull request is out of scope for the project, or the idea is good but the implementation is poor. Whatever the reason, when closing a pull request maintainers should keep the conversation friendly:</p><ul><li><strong>Thank</strong> them for their contribution.</li><li><strong>Explain why</strong> it doesn't fit into the scope of the project.</li><li><strong>Link to relevant documentation</strong>, if you have it.</li><li><strong>Close</strong> the request.</li></ul><h2><a class="anchor" name="defusing-situations"></a>Defusing situations <a class="hash-link" href="docs/maintainers.html#defusing-situations">#</a></h2><p>Sometimes when a maintainer says no to a pull request or close an issue, a contributor may get upset and criticize your decision. Maintainers will take steps to defuse the situation.</p><p>If a contributor becomes hostile or disrespectful, they will be referred to the <a href="https://code.facebook.com/codeofconduct" target="_blank">Code of Conduct</a>. Negative users will be blocked, and inappropriate comments will be deleted.</p><h2><a class="anchor" name="facebook-github-bot"></a>Facebook GitHub Bot <a class="hash-link" href="docs/maintainers.html#facebook-github-bot">#</a></h2><p>The Facebook GitHub Bot allows members of the community to perform administrative actions such as labeling and closing issues. 
To have access to the bot, please add your GitHub username to the first line of <a href="https://github.com/facebook/react-native/blob/master/bots/IssueCommands.txt" target="_blank">IssueCommands.txt</a>, in alphabetical order, by submitting a Pull Request.</p><h3><a class="anchor" name="using-the-facebook-github-bot"></a>Using the Facebook GitHub Bot <a class="hash-link" href="docs/maintainers.html#using-the-facebook-github-bot">#</a></h3><p>The bot can be triggered by adding any of the following commands as a standalone comment on an issue:</p><span><div class="botActions">
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

</span><p>Additionally, the following commands can be used on a pull request:</p><span><div class="botActions">
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
</span></div><div class="docs-prevnext"><a class="docs-prev btn" href="docs/contributing.html#content">← Previous</a><a class="docs-next btn" href="docs/testing.html#content">Continue Reading →</a></div><p class="edit-page-block"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/docs/Maintainers.md">Improve this page</a> by sending a pull request!</p>