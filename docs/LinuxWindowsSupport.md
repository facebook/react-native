---
id: linux-windows-support
title: Linux and Windows Support
layout: docs
category: Quick Start
permalink: docs/linux-windows-support.html
next: tutorial
---

__NOTE: This guide focuses on Android development. You'll need a Mac to build iOS apps.__

As React Native on iOS requires a Mac and most of the engineers at Facebook and contributors use Macs, support for OS X is a top priority. However, we would like to support developers using Linux and Windows too. We believe we'll get the best Linux and Windows support from people using these operating systems on a daily basis. 

Therefore, Linux and Windows support for the development environment is an ongoing community responsibility. This can mean filing issues and submitting PRs, and we'll help review and merge them. We are looking forward to your contributions and appreciate your patience.

As of **version 0.13** (currently in rc) Android development with React native is mostly possible on Linux and Windows. You'll need to install [Node.js](https://nodejs.org/) 4.0 or newer. On Linux we recommend installing [watchman](https://facebook.github.io/watchman/docs/install.html), otherwise you might hit a node file watching bug.

## What's missing on Linux

The basic Android development workflow should be working.

Opening the Chrome debugger when you select Menu -> Debug JS is not supported yet. There is the [PR #3394](https://github.com/facebook/react-native/pull/3394) for this (merged in 0.14.0-rc).

## What's missing on Windows

On Windows the packager won't be started automatically when you run `react-native run-android`. You can start it manually using:
    
    cd MyAwesomeApp
    node node_modules/react-native/packager/packager.js

Opening the Chrome debugger when you select Menu -> Debug JS is not supported yet. There is the [PR #3394](https://github.com/facebook/react-native/pull/3394) for this (merged in 0.14.0-rc).
