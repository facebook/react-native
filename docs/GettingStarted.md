---
id: getting-started
title: Getting Started
layout: docs
category: Quick Start
permalink: docs/getting-started.html
next: android-setup
---

## Requirements

1. OS X - Only OS X is currently supported
2. [Homebrew](http://brew.sh/) is the recommended way to install io.js, watchman, and flow.
3. Install [io.js](https://iojs.org/) 1.0 or newer. io.js is the modern version of Node.
  - Install **nvm** with [its setup instructions here](https://github.com/creationix/nvm#installation). Then run `nvm install iojs-v2 && nvm alias default iojs-v2`, which installs the latest compatible version of io.js and sets up your terminal so that typing `node` runs io.js. With nvm you can install multiple versions of Node and io.js and easily switch between them.
  - New to [npm](https://docs.npmjs.com/)?
4. `brew install watchman`. We recommend installing [watchman](https://facebook.github.io/watchman/docs/install.html), otherwise you might hit a node file watching bug.
5. `brew install flow`. If you want to use [flow](http://www.flowtype.org).

We recommend periodically running `brew update && brew upgrade` to keep your programs up-to-date.

## iOS Setup

[Xcode](https://developer.apple.com/xcode/downloads/) 6.3 or higher is required. It can be installed from the App Store.

## Android Setup

To write React Native apps for Android, you will need to install the Android SDK (and an Android emulator if you want to work on your app without having to use a physical device). See [Android setup guide](android-setup.html) for instructions on how to set up your Android environment.

## Quick start

    $ npm install -g react-native-cli
    $ react-native init AwesomeProject
    $ cd AwesomeProject/

**To run the iOS app:**

- Open `ios/AwesomeProject.xcodeproj` and hit run in Xcode.
- Open `index.ios.js` in your text editor of choice and edit some lines.
- Hit ⌘-R in your iOS simulator to reload the app and see your change!

**To run the Android app:**

* `$ react-native run-android`
* Open `index.android.js` in your text editor of choice and edit some lines.
* Press the menu button (F2 by default, or ⌘-M in Genymotion) and select *Reload JS* to see your change!
* Run `adb logcat *:S ReactNative:V ReactNativeJS:V` in a terminal to see your app's logs

Congratulations! You've successfully run and modified your first React Native app.

_If you run into any issues getting started, see the [troubleshooting page](/react-native/docs/troubleshooting.html#content)._

## Adding Android to an existing React Native project

If you already have a (iOS-only) React Native project and want to add Android support, you need to execute the following commands in your existing project directory:

1. Update the `react-native` dependency in your `package.json` file to [the latest version](https://www.npmjs.com/package/react-native)
2. `$ npm install`
3. `$ react-native android`
