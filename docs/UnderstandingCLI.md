---
id: understanding-cli
title: Understanding the CLI
layout: docs
category: Guides
permalink: docs/understanding-cli.html
banner: ejected
next: integration-with-existing-apps
previous: running-on-device
---

Though you may have installed the `react-native-cli` via npm as a separate module, it is a shell for accessing the CLI embedded
in the React Native of each project. Your commands and their effects are dependent on the version of the module of `react-native`
in context of the project. This guide will give a brief overview of the CLI in the module.

# The local CLI

React Native has a [`local-cli`](https://github.com/facebook/react-native/tree/master/local-cli) folder with a file named
[`cliEntry.js`](https://github.com/facebook/react-native/blob/master/local-cli/cliEntry.js).  Here, the commands are read
from `commands.js` and added as possible CLI commands.  _E.G._ the `react-native link` command, exists in the
[`react-native/local-cli/link`](https://github.com/facebook/react-native/blob/master/local-cli/link/) folder, and is
required in `commands.js`, which will register it as a documented command to be exposed to the CLI.

# Command definitions

At the end of each command entry is an export.  The export is an object with a function to perform, description of the command, and the command name.  The object structure for the `link` command looks like so:

```js
module.exports = {
  func: link,
  description: 'links all native dependencies',
  name: 'link [packageName]',
};
```

### Parameters

The command name identifies the parameters that a command would expect.  When the command parameter is surrounded by greater-than, less-than symbols `< >`, this indicates that the parameter is expected.  When a parameter is surrounded by brackets `[ ]`, this indicates that the parameter is optional.
