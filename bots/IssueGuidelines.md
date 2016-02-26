Use the following tips when responding to GitHub issues.

### An issue is a duplicate of another issue
Comment e.g. `@facebook-github-bot /duplicate #123`. This will add a comment and close the issue.
Example: #5977

### An issue is a question
StackOverflow is really good for Q&A. It has a reputation system and voting. Questions should absolutely be asked on StackOverflow rather than GitHub. However, to make this work we should hang out on StackOverflow every now and then and answer questions. A nice side effect is you'll get reputation for answering questions there rather than on GitHub.
Comment `@facebook-github-bot /question` to close the issue.
Examples: #6015, #6059, #6062

### An issue is a question that's been answered
Sometimes and issue has been resolved in the comments. Resolved issues should be closed.
Comment `@facebook-github-bot /answered` to close it.
Example: #6045

### An issue needs more information
It is impossible to understand and reproduce the issue without more information, e.g. a short code sample, screenshot.
Do the following:
- Explain what additional info you need to understand the issue
- Comment `@facebook-github-bot /add-label Needs more information`
Examples: #6056, #6008, #5491

### An issue with label 'Needs more information' has been open for more than a week
Comment mentioning the author asking if they plan to provide the additional information. If they don't come back close the issue using `@facebook-github-bot /no-reply`.
Example: #6056

### Want to add a label
Add any relevant labels, for example 'Android', 'iOS'.
Comment e.g. `@facebook-github-bot /add-label Android`.

### Want to reopen a closed issue
For example an issue was closed waiting for the author, the author replied and it turns out this is indeed a bug.
Comment `@facebook-github-bot /reopen`

### Commands for the bot
When you mention the bot, it follows the commands defined in [IssueCommands.txt](https://github.com/facebook/react-native/blob/master/bots/IssueCommands.txt).
