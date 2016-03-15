---
id: getting-started
title: Getting Started
layout: docs
category: Quick Start
permalink: docs/getting-started.html
next: getting-started-linux
---

## Requirements

1. OS X - This guide assumes OS X which is needed for iOS development.
2. [Homebrew](http://brew.sh/) is the recommended way to install Watchman and Flow.
3. Install [Node.js](https://nodejs.org/) 4.0 or newer.
  - Install **nvm** with [its setup instructions here](https://github.com/creationix/nvm#installation). Then run `nvm install node && nvm alias default node`, which installs the latest version of Node.js and sets up your terminal so you can run it by typing `node`. With nvm you can install multiple versions of Node.js and easily switch between them.
  - New to [npm](https://docs.npmjs.com/)?
4. `brew install watchman`. We recommend installing [watchman](https://facebook.github.io/watchman/docs/install.html), otherwise you might hit a node file watching bug.
5. `brew install flow`, if you want to use [flow](http://www.flowtype.org).

We recommend periodically running `brew update && brew upgrade` to keep your programs up-to-date.

## iOS Setup

[Xcode](https://developer.apple.com/xcode/downloads/) 7.0 or higher is required. It can be installed from the App Store.

## Android Setup

To write React Native apps for Android, you will need to install the Android SDK (and an Android emulator if you want to work on your app without having to use a physical device). See [Android setup guide](docs/android-setup.html) for instructions on how to set up your Android environment.

_NOTE:_ There is experimental [Windows and Linux support](docs/linux-windows-support.html) for Android development.

## Quick start

Install the React Native command line tools:

    $ npm install -g react-native-cli

__NOTE__: If you see the error, `EACCES: permission denied`, please run the command: `sudo npm install -g react-native-cli`.

Create a React Native project:

    $ react-native init AwesomeProject


**To run the iOS app:**

- `$ cd AwesomeProject`
- Open `ios/AwesomeProject.xcodeproj` and hit run in Xcode.
- Open `index.ios.js` in your text editor of choice and edit some lines.
- Hit ⌘-R in your iOS simulator to reload the app and see your change!

_Note: If you are using an iOS device, see the [Running on iOS Device page](docs/running-on-device-ios.html#content)._

**To run the Android app:**

- `$ cd AwesomeProject`
- `$ react-native run-android`
- Open `index.android.js` in your text editor of choice and edit some lines.
- Press the menu button (F2 by default, or ⌘-M in Genymotion) and select *Reload JS* to see your change!
- Run `adb logcat *:S ReactNative:V ReactNativeJS:V` in a terminal to see your app's logs

_Note: If you are using an Android device, see the [Running on Android Device page](docs/running-on-device-android.html#content)._

Congratulations! You've successfully run and modified your first React Native app.

_If you run into any issues getting started, see the [troubleshooting page](docs/troubleshooting.html#content)._

## Adding Android to an existing React Native project

If you already have a (iOS-only) React Native project and want to add Android support, you need to execute the following commands in your existing project directory:

1. Update the `react-native` dependency in your `package.json` file to [the latest version](https://www.npmjs.com/package/react-native)
2. `$ npm install`
3. `$ react-native android`
