---
id: version-0.46-maintainers
title: maintainers
original_id: maintainers
---
<a id="content"></a><h1><a class="anchor" name="what-to-expect-from-maintainers"></a>What to Expect from Maintainers <a class="hash-link" href="docs/maintainers.html#what-to-expect-from-maintainers">#</a></h1><div><p>So you have read through the <a href="docs/contributing.html" target="_blank">contributor's guide</a> and you're getting ready to send your first pull request. Perhaps you've found an issue in React Native and want to work with the maintainers to land a fix. Here's what you can expect to happen when you open an issue or send a pull request.</p><blockquote><p>The following is adapted from the excellent <a href="https://opensource.guide/" target="_blank">Open Source Guide</a> from GitHub and reflects how the maintainers of React Native are encouraged to handle your contributions.</p></blockquote><h2><a class="anchor" name="handling-issues"></a>Handling Issues <a class="hash-link" href="docs/maintainers.html#handling-issues">#</a></h2><p>We see dozens of new issues being created every day. In order to help maintainers focus on what is actionable, maintainers ask contributors to do a bit of work prior to opening a new issue:</p><ul><li>New issues should follow the <a href="https://github.com/facebook/react-native/blob/master/.github/ISSUE_TEMPLATE.md" target="_blank">Issue Template</a>.</li><li>Issues should provide clear, easy to follow steps alongside sample code to reproduce the issue. Ideally, provide a <a href="http://snack.expo.io/" target="_blank">Snack</a>.</li></ul><p>Issues that do not  meet the above criteria can be closed immediately, with a link to the <a href="docs/contributing.html" target="_blank">contributor's guide</a>.</p><h3><a class="anchor" name="issues-should-be-reproducible"></a>Issues should be reproducible <a class="hash-link" href="docs/maintainers.html#issues-should-be-reproducible">#</a></h3><p>Issues should be relatively easy to reproduce. Sometimes the issue affects a particular app but a minimal repro is not provided, perhaps a crash is seen in the logs and the author is not sure where its coming from, maybe the issue is sporadic.</p><p>As it happens, if a maintainer cannot easily reproduce the issue, one cannot reasonably expect them to be able to work on a fix. These issues can be closed with a short explanation why.</p><p>Exceptions can be made if multiple people appear to be affected by the issue, especially right after a new React Native release is cut.</p><h3><a class="anchor" name="new-issue-runbook"></a>New issue runbook <a class="hash-link" href="docs/maintainers.html#new-issue-runbook">#</a></h3><p>You have gathered all the information required to open a new issue, and you are confident it meets the <a href="docs/contributing.html" target="_blank">contributor guidelines</a>. Once you post an issue, this is what our maintainers will consider when deciding how to move forward:</p><ol><li>Is this issue a feature request? If so, they will ask you to use Canny for feature requests by issuing the <code>@facebook-github-bot feature</code> command, closing the issue.</li><li>Is this issue a request for help? If so, the maintainer will encourage you to ask on Stack Overflow by issuing the <code>@facebook-github-bot stack-overflow</code> command, closing the issue.</li><li>Was the <a href="https://github.com/facebook/react-native/blob/master/.github/ISSUE_TEMPLATE.md" target="_blank">Issue Template</a> used to fill out the issue? Did the author answer Yes to both questions at the top? If not, the maintainer will ask you to provide more information by issuing the <code>@facebook-github-bot no-template</code> command, closing the issue.</li><li>Does the issue include a Snack or list of steps to reproduce the issue? If not, a maintainer will ask for a repro by issuing the <code>@facebook-github-bot needs-repro</code> command.</li><li>Can the issue be reliably reproduced? If not, a maintainer may issue the <code>@facebook-github-bot cannot-repro</code> command, closing the issue.</li><li>Is the issue for an old release of React Native? If so, expect to be asked if the issue can be reproduced in the latest release candidate.</li></ol><p>You can learn more about how GitHub Bot commands are used <a href="docs/maintainers.html#facebook-github-bot" target="_blank">here</a>.</p><h3><a class="anchor" name="triaging-issues"></a>Triaging issues <a class="hash-link" href="docs/maintainers.html#triaging-issues">#</a></h3><p>If a issue is still open after going through all of the checks above, it will move on to the triage stage. A maintainer will then do the following:</p><ol><li>Add relevant labels: iOS, Android, Tooling, Documentation. They will do so by issuing the <code>@facebook-github-bot label</code> command.</li><li>Leave a comment saying the issue has been triaged.</li><li>Tag the relevant people.</li></ol><p>For example, if a issue describes something that needs to be addressed before the next release is cut, a maintainer may tag @grabbou. If the issue concerns Animated, they may tag @janicduplessis. If this is a docs issue, they may tag @hramos. You can generally figure out who is interested in what sort of issue by looking at the <a href="https://github.com/facebook/react-native/blob/master/.github/CODEOWNERS" target="_blank">CODEOWNERS</a> file.</p><h3><a class="anchor" name="stale-issues"></a>Stale issues <a class="hash-link" href="docs/maintainers.html#stale-issues">#</a></h3><p>Issues that have been open for over six months and have had no activity in the last two months may be closed periodically. If your issue gets closed in this manner, it's nothing personal. If you strongly believe that the issue should remain open, just let us know why.</p><p>Simply commenting that the issue still exists is not very compelling (it's rare for critical, release blocking issues to have no activity for two months!). In order to make a good case for reopening the issue, you may need to do a bit of work:</p><ul><li>Can the issue be reproduced on the latest release candidate? Post a comment with the version you tested.</li><li>If so, is there any information missing from the bug report? Post a comment with all the information required by the <a href="https://github.com/facebook/react-native/blob/master/.github/ISSUE_TEMPLATE.md" target="_blank">issue template</a>.</li><li>Is there a pull request that addressed this issue? Post a comment with the PR number so we can follow up.</li></ul><p>A couple of contributors making a good case may be all that is needed to reopen the issue.</p><h2><a class="anchor" name="handling-pull-requests"></a>Handling pull requests <a class="hash-link" href="docs/maintainers.html#handling-pull-requests">#</a></h2><p>The core team will be monitoring for pull requests. When we get one, we'll run some Facebook-specific integration tests on it first. From here, we'll need to get another person to sign off on the changes and then merge the pull request. For API changes we may need to fix internal uses, which could cause some delay. We'll do our best to provide updates and feedback throughout the process.</p><h3><a class="anchor" name="how-we-prioritize-pull-requests"></a>How we prioritize pull requests <a class="hash-link" href="docs/maintainers.html#how-we-prioritize-pull-requests">#</a></h3><p>We use the <a href="https://github.com/hzoo/contributors-on-github" target="_blank">Contributors Chrome extension</a> to help us understand who is sending a pull request. Pull requests opened by contributors that have a history of having their PRs merged are more likely to be looked at first. Aside from that, we try to go through pull requests on a chronological order.</p><h3><a class="anchor" name="how-we-review-pull-requests"></a>How we review pull requests <a class="hash-link" href="docs/maintainers.html#how-we-review-pull-requests">#</a></h3><p>Reviewing a PR can sometimes require more time from a maintainer than it took you to write the code. Maintainers need to consider all the ramifications of importing your patch into the codebase. Does it potentially introduce breaking changes? What are the performance considerations of adding a new dependency? Will the docs need to be updated as well? Does this belong in core, or would it be a better fit as a third party package?</p><p>Finding the right person to review a pull request can sometimes be tricky. A pull request may simultaneously touch iOS, Java, and JavaScript code. If a pull request has been waiting for review for a while, you can help out by looking at the blame history for the files you're touching. Is there anyone that appears to be knowledgeable in the part of the codebase the PR is touching?</p><h3><a class="anchor" name="closing-pull-requests"></a>Closing pull requests <a class="hash-link" href="docs/maintainers.html#closing-pull-requests">#</a></h3><p>Sometimes a maintainer may decide that a pull request will not be accepted. Maybe the pull request is out of scope for the project, or the idea is good but the implementation is poor. Whatever the reason, when closing a pull request maintainers should keep the conversation friendly:</p><ul><li><strong>Thank</strong> them for their contribution.</li><li><strong>Explain why</strong> it doesn't fit into the scope of the project.</li><li><strong>Link to relevant documentation</strong>, if you have it.</li><li><strong>Close</strong> the request.</li></ul><h2><a class="anchor" name="defusing-situations"></a>Defusing situations <a class="hash-link" href="docs/maintainers.html#defusing-situations">#</a></h2><p>Sometimes when a maintainer says no to a pull request or close an issue, a contributor may get upset and criticize your decision. Maintainers will take steps to defuse the situation.</p><p>If a contributor becomes hostile or disrespectful, they will be referred to the <a href="https://code.facebook.com/codeofconduct" target="_blank">Code of Conduct</a>. Negative users will be blocked, and inappropriate comments will be deleted.</p><h2><a class="anchor" name="facebook-github-bot"></a>Facebook GitHub Bot <a class="hash-link" href="docs/maintainers.html#facebook-github-bot">#</a></h2><p>The Facebook GitHub Bot allows certain active members of the community to perform administrative actions such as labeling and closing issues. The list of community members with this kind of access can be found at the top of the <a href="https://github.com/facebook/react-native/blob/master/bots/IssueCommands.txt" target="_blank">IssueCommands.txt</a> file in the repository.</p><p>Once you have become an active contributor in the community, you may open a pull request to add yourself to the list, making sure to list your prior contributions to the community when doing so.</p><h3><a class="anchor" name="using-the-facebook-github-bot"></a>Using the Facebook GitHub Bot <a class="hash-link" href="docs/maintainers.html#using-the-facebook-github-bot">#</a></h3><p>The bot can be triggered by adding any of the following commands as a standalone comment on an issue:</p><span><div class="botActions">
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
</div>
</span></div><div class="docs-prevnext"><a class="docs-prev" href="docs/testing.html#content">← Prev</a><a class="docs-next" href="docs/understanding-cli.html#content">Next →</a></div><p class="edit-page-block"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/docs/Maintainers.md">Improve this page</a> by sending a pull request!</p>