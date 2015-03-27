---
id: getting-started
title: Getting Started
layout: docs
category: Quick Start
permalink: docs/getting-started.html
next: tutorial
---

## Requirements

1. OS X - This repo only contains the iOS implementation right now, and Xcode only runs on Mac.
2. New to Xcode?  [Download it](https://developer.apple.com/xcode/downloads/) from the Mac App Store.
3. [Homebrew](http://brew.sh/) is the recommended way to install node, watchman, and flow.
4. `brew install node`. New to [node](https://nodejs.org/) or [npm](https://docs.npmjs.com/)?
5. `brew install watchman`. We recommend installing [watchman](https://facebook.github.io/watchman/docs/install.html), otherwise you might hit a node file watching bug.
6. `brew install flow`. If you want to use [flow](http://www.flowtype.org).

## Quick start

- `npm install -g react-native-cli`
- `react-native init AwesomeProject`

In the newly created folder `AwesomeProject/`

- Open `AwesomeProject.xcodeproj` and hit run in Xcode
- Open `index.ios.js` in your text editor of choice and edit some lines
- Hit cmd+R ([twice](http://openradar.appspot.com/19613391)) in your iOS simulator to reload the app and see your change!

If Cmd-R is not responding, enable iOS simulator's "Connect hardware keyboard" from menu Hardware > Keyboard menu. 

![keyboard menu](https://cloud.githubusercontent.com/assets/1388454/6863127/03837824-d409-11e4-9251-e05bd31d978f.png)

Congratulations! You've just successfully run and modified your first React Native app.

