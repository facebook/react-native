---
id: getting-started
title: Getting Started
layout: docs
category: Quick Start
permalink: docs/getting-started.html
next: tutorial
---

## Requirements

1. OS X - This repo only contains the iOS (7+) implementation right now, and Xcode only runs on Mac.
2. [Xcode](https://developer.apple.com/xcode/downloads/) 6.3 or higher is recommended.
3. [Homebrew](http://brew.sh/) is the recommended way to install io.js, watchman, and flow.
4. Install [io.js](https://iojs.org/) 1.0 or newer. io.js is the modern version of Node.
  - **With nvm:** Install nvm with [its setup instructions here](https://github.com/creationix/nvm#installation). Then run `nvm install iojs-v2 && nvm alias default iojs-v2`, which installs the latest compatible version of io.js and sets up your terminal so that typing `node` runs io.js. With nvm you can install multiple versions of Node and io.js and easily switch between them.
  - **With Homebrew:** Run `brew install iojs && brew link iojs --force`. You may need to run `brew unlink node` if you have previously installed Node.
  - New to [npm](https://docs.npmjs.com/)?
5. `brew install watchman`. We recommend installing [watchman](https://facebook.github.io/watchman/docs/install.html), otherwise you might hit a node file watching bug.
6. `brew install flow`. If you want to use [flow](http://www.flowtype.org).

We recommend periodically running `brew update && brew upgrade` to keep your programs up-to-date.

## Quick start

- `npm install -g react-native-cli`
- `react-native init AwesomeProject`

In the newly created folder `AwesomeProject/`

- Open `AwesomeProject.xcodeproj` and hit run in Xcode.
- Open `index.ios.js` in your text editor of choice and edit some lines.
- Hit cmd+R in your iOS simulator to reload the app and see your change!

Congratulations! You've just successfully run and modified your first React Native app.

_If you run into any issues getting started, see the [troubleshooting page](/react-native/docs/troubleshooting.html#content)._
