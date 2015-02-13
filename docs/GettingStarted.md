---
id: getting-started
title: Getting Started
layout: docs
category: Quick Start
permalink: docs/getting-started.html
next: navigatorios
---


Our first React Native implementation is `ReactKit`, targeting iOS.  We are also
working on an Android implementation which we will release later.  `ReactKit`
apps are built using the [React JS](https://github.com/facebook/react) framework, and render directly to
native UIKit elements using a fully asynchronous architecture.  There is no
browser and no HTML. We have picked what we think is the best set of features
from these and other technologies to build what we hope to become the best
product development framework available, with an emphasis on iteration speed,
developer delight, continuity of technology, and absolutely beautiful and fast
products with no compromises in quality or capability.

## Requirements

1. OS X - This repo only contains the iOS implementation right now, and Xcode only runs on Mac.
2. New to Xcode?  [Download it](https://developer.apple.com/xcode/downloads/) from the Mac App Store.
3. [Homebrew](http://brew.sh/) is the recommended way to install node, watchman, and flow.
4. New to node or npm? `brew install node`
5. We recommend installing [watchman](https://facebook.github.io/watchman/docs/install.html), otherwise you might hit a node file watching bug.  `brew install watchman`
6. If you want to use [flow](http://www.flowtype.org), `brew install flow`

## Quick start

Get up and running with our Movies sample app:

1. Once you have the repo cloned and met all the requirements above, start the
packager that will transform your JS code on-the-fly:

  ```
  npm install
  npm start
  ```
2. Open the `Examples/Movies/Movies.xcodeproj` project in Xcode.
3. Make sure the target is set to `Movies` and that you have an iOS simulator
selected to run the app.
4. Build and run the project with the Xcode run button.

You should now see the Movies app running on your iOS simulator.
Congratulations!  You've just successfully run your first React Native app.

Now try editing a JavaScript file and viewing your changes. Let's change the
movie search placeholder text:

1. Open the `Examples/Movies/SearchScreen.js` file in your favorite JavaScript
editor.
2. Look for the current search placeholder text and change it to "Search for an
awesome movie...".
3. Hit cmd+R ([twice](http://openradar.appspot.com/19613391)) in your iOS simulator to reload the app and see your change.
If you don't immediately see your changes, try restarting your app within Xcode.

Feel free to browse the Movies sample files and customize various properties to
get familiar with the codebase and React Native.

Also check out the UI Component Explorer for more sample code:
`Examples/UIExplorer/UIExplorer.xcodeproj`.  **Make sure to close the Movies
project first - Xcode will break if you have two projects open that reference
the same library.**

## Troubleshooting

+ Xcode will break if you have two examples open at the same time.
+ If `npm start` fails with log spew like:
  ```
  2015-02-02 10:56 node[24294] (FSEvents.framework) FSEventStreamStart: register_with_server: ERROR: f2d_register_rpc() => (null) (-21)
  ```
then you've hit the node file watching bug - `brew install watchman` should fix the issue.
+ Jest testing does not yet work on node versions after 0.10.x.
+ You can verify the packager is working by loading the [bundle](http://localhost:8081/Examples/Movies/MoviesApp.includeRequire.runModule.bundle) in your browser and
inspecting the contents.

Please report any other issues you encounter so we can fix them ASAP.
