Use the following tips when responding to GitHub issues.

### An issue is a duplicate of another issue
Comment e.g. `@facebook-github-bot duplicate #123`. This will add a comment and close the issue.
Example: [#5977](https://github.com/facebook/react-native/issues/5977)

### An issue is a question
StackOverflow is really good for Q&A. It has a reputation system and voting. Questions should absolutely be asked on StackOverflow rather than GitHub. However, to make this work we should hang out on StackOverflow every now and then and answer questions. A nice side effect is you'll get reputation for answering questions there rather than on GitHub.
Comment `@facebook-github-bot stack-overflow` to close the issue.
Examples: [#6015](https://github.com/facebook/react-native/issues/6015), [#6059](https://github.com/facebook/react-native/issues/6059), [#6062](https://github.com/facebook/react-native/issues/6062)

### An issue is a question that's been answered
Sometimes and issue has been resolved in the comments. Resolved issues should be closed.
Comment `@facebook-github-bot answered` to close it.
Example: [#6045](https://github.com/facebook/react-native/issues/6045)

### An issue needs more information
It is impossible to understand and reproduce the issue without more information, e.g. a short code sample, screenshot.
Do the following:
- Explain what additional info you need to understand the issue
- Comment `@facebook-github-bot label Needs more information`
Examples: [#6056](https://github.com/facebook/react-native/issues/6056), [#6008](https://github.com/facebook/react-native/issues/6008), [#5491](https://github.com/facebook/react-native/issues/5491)

### An issue with label 'Needs more information' has been open for more than a week
Comment mentioning the author asking if they plan to provide the additional information. If they don't come back close the issue using `@facebook-github-bot no-reply`.
Example: [#6056](https://github.com/facebook/react-native/issues/6056)

### An issue is a valid bug report
Valid bug reports with good repro steps are some of the best issues! Thank the author for finding it, explain that React Native is a community project and ask them if they would be up for sending a fix.

### An issue is a feature request and you're pretty sure React Native should have that feature
Tell the author something like: "Pull requests are welcome. In case you're not up for sending a PR, you should post to [Product Pains](https://productpains.com/product/react-native/?tab=top). It has a voting system and if the feature gets upvoted enough it might get implemented."

### An issue is a feature request for a feature we don't want
This especially includes **new modules** Facebook doesn't use in production. Explain that those modules should be released to npm separately and that everyone will still be able to use the module super easily that way.

### How to add a label
Add any relevant labels, for example 'Android', 'iOS'.
Comment e.g. `@facebook-github-bot label Android`

### How to reopen a closed issue
For example an issue was closed waiting for the author, the author replied and it turns out this is indeed a bug.
Comment `@facebook-github-bot reopen`

### What are all the available commands for the bot?
When you mention the bot, it follows the commands defined in [IssueCommands.txt](https://github.com/facebook/react-native/blob/master/bots/IssueCommands.txt).
