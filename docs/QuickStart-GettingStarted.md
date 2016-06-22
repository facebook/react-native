---
id: quick-start-getting-started
title: Getting Started
layout: docs
category: The Basics
permalink: docs/getting-started.html
next: basics-components
---


<div class="toggler">
<style>
.toggler a {
  display: inline-block;
  padding: 10px 5px;
  margin: 2px;
  border: 1px solid #05A5D1;
  border-radius: 3px;
  text-decoration: none !important;
}
.display-os-mac .toggler .button-mac,
.display-os-linux .toggler .button-linux,
.display-os-windows .toggler .button-windows,
.display-platform-ios .toggler .button-ios,
.display-platform-android .toggler .button-android {
  background-color: #05A5D1;
  color: white;
}
block { display: none; }
.display-platform-ios.display-os-mac .ios.mac,
.display-platform-ios.display-os-linux .ios.linux,
.display-platform-ios.display-os-windows .ios.windows,
.display-platform-android.display-os-mac .android.mac,
.display-platform-android.display-os-linux .android.linux,
.display-platform-android.display-os-windows .android.windows {
  display: block;
}</style>
<span>Target:</span>
<a href="javascript:void(0);" class="button-ios" onclick="display('platform', 'ios')">iOS</a>
<a href="javascript:void(0);" class="button-android" onclick="display('platform', 'android')">Android</a>
<span>Development OS:</span>
<a href="javascript:void(0);" class="button-mac" onclick="display('os', 'mac')">Mac</a>
<a href="javascript:void(0);" class="button-linux" onclick="display('os', 'linux')">Linux</a>
<a href="javascript:void(0);" class="button-windows" onclick="display('os', 'windows')">Windows</a>
</div>

<!-- ######### LINUX AND WINDOWS for iOS ##################### -->

<block class="linux windows ios" />

## Unsupported

<div>Unfortunately, Apple only lets you develop for iOS on a Mac. If you want to build an iOS app but you don't have a Mac yet, you can try starting with the <a href="" onclick="display('platform', 'android')">Android</a> instructions instead.</div>

<center><img src="img/react-native-sorry-not-supported.png" width="150"></img></center>

<!-- ######### MAC for iOS ##################### -->

<block class="mac ios" />

## Dependencies

You will need Xcode, node.js, the React Native command line tools, and Watchman.

<block class="mac android" />

## Dependencies

You will need Android Studio, node.js, the React Native command line tools, and Watchman.

<block class="mac ios android" />

We recommend installing node and watchman via [Homebrew](http://brew.sh/).

```
brew install node
brew install watchman
```

Node comes with npm, which lets you install the React Native command line interface.

```
npm install -g react-native-cli
```

If you get a permission error, try with sudo: `sudo npm install -g react-native-cli`.

<block class="mac ios" />

The easiest way to install Xcode is via the [Mac App Store](https://itunes.apple.com/us/app/xcode/id497799835?mt=12).

<block class="mac android" />

Download and install [Android Studio](https://developer.android.com/studio/install.html).

If you plan to make changes in Java code, we recommend [Gradle Daemon](https://docs.gradle.org/2.9/userguide/gradle_daemon.html) which speeds up the build.


<!-- ######### LINUX and WINDOWS for ANDROID ##################### -->

<block class="linux windows android" />

## Dependencies

You will need node.js, the React Native command line tools, Watchman, and Android Studio.

<block class="linux android" />

Follow the [installation instructions for your Linux distribution](https://nodejs.org/en/download/package-manager/) to install Node.js 4 or newer.

<block class='windows android' />

We recommend installing node.js and Python2 via [Chocolatey](https://chocolatey.org), a popular package manager for Windows. Open a Command Prompt as Administrator, then run:

```
choco install nodejs.install
choco install python2
```

<block class="windows linux android" />

Node comes with npm, which lets you install the React Native command line interface.

```
npm install -g react-native-cli
```

<block class="windows linux android" />

Download and install [Android Studio](https://developer.android.com/studio/install.html).

<block class="linux android" />

[Watchman](https://facebook.github.io/watchman) is a tool by Facebook for watching changes in the filesystem. Installing it should
improve performance, but you can also try not installing it, if the installation process is too annoying. You can follow the [Watchman installation guide](https://facebook.github.io/watchman/docs/install.html#installing-from-source) to compile and install from source.

<block class="windows linux android" />

If you plan to make changes in Java code, we recommend [Gradle Daemon](https://docs.gradle.org/2.9/userguide/gradle_daemon.html) which speeds up the build.

<block class="mac ios android" />

## Testing your React Native Installation

<block class="mac ios" />

Use the React Native command line tools to generate a new React Native project called "AwesomeProject", then run `react-native run-ios` inside the newly created folder.

```
react-native init AwesomeProject
cd AwesomeProject
react-native run-ios
```

You should see your new app running in the iOS Simulator shortly. `react-native run-ios` is just one way to run your app - you can also run it directly from within Xcode or Nuclide.

<block class="mac android" />

Use the React Native command line tools to generate a new React Native project called "AwesomeProject", then run `react-native run-android` inside the newly created folder.

```
react-native init AwesomeProject
cd AwesomeProject
react-native run-android
```

If everything is set up correctly, you should see your new app running in your Android emulator shortly. `react-native run-android` is just one way to run your app - you can also run it directly from within Android Studio or Nuclide.

<block class="mac ios android" />

### Modifying your app

Now that you have successfully run the app, let's modify it.

<block class="mac ios" />

- Open `index.ios.js` in your text editor of choice and edit some lines.
- Hit `Command⌘ + R` in your iOS Simulator to reload the app and see your change!

<block class="mac android" />

- Open `index.android.js` in your text editor of choice and edit some lines.
- Press the `R` key twice or select `Reload` from the Developer Menu to see your change!

<block class="mac ios android" />

### That's it!

Congratulations! You've successfully run and modified your first React Native app.

<center><img src="img/react-native-congratulations.png" width="150"></img></center>

<block class="windows linux android" />

## Testing your React Native Installation

Use the React Native command line tools to generate a new React Native project called "AwesomeProject", then run `react-native run-android` inside the newly created folder.

```
react-native init AwesomeProject
cd AwesomeProject
react-native run-android
```

If everything is set up correctly, you should see your new app running in your Android emulator shortly.

> A common issue is that the packager is not started automatically when you run
`react-native run-android`. You can start it manually using `react-native start`.

<block class="windows android" />

> If you hit a `ERROR  Watcher took too long to load` on Windows, try increasing the timeout in [this file](https://github.com/facebook/react-native/blob/5fa33f3d07f8595a188f6fe04d6168a6ede1e721/packager/react-packager/src/DependencyResolver/FileWatcher/index.js#L16) (under your `node_modules/react-native/`).

<block class="windows linux android" />

### Modifying your app

Now that you have successfully run the app, let's modify it.

- Open `index.android.js` in your text editor of choice and edit some lines.
- Press the `R` key twice or select `Reload` from the Developer Menu to see your change!

### That's it!

Congratulations! You've successfully run and modified a React Native app.

<center><img src="img/react-native-congratulations.png" width="150"></img></center>

<block class="mac windows linux ios android" />

## Special Cases

- This page explains how to create a new React Native app. If you are adding React Native components to an existing application, check out the [Integration guide](docs/integration-with-existing-apps.html).

- If you run into any issues getting started, see the [Troubleshooting](docs/troubleshooting.html#content) page.

<script>
// Convert <div>...<span><block /></span>...</div>
// Into <div>...<block />...</div>
var blocks = document.getElementsByTagName('block');
for (var i = 0; i < blocks.length; ++i) {
  var block = blocks[i];
  var span = blocks[i].parentNode;
  var container = span.parentNode;
  container.insertBefore(block, span);
  container.removeChild(span);
}
// Convert <div>...<block />content<block />...</div>
// Into <div>...<block>content</block><block />...</div>
blocks = document.getElementsByTagName('block');
for (var i = 0; i < blocks.length; ++i) {
  var block = blocks[i];
  while (block.nextSibling && block.nextSibling.tagName !== 'BLOCK') {
    block.appendChild(block.nextSibling);
  }
}
function display(type, value) {
  var container = document.getElementsByTagName('block')[0].parentNode;
  container.className = 'display-' + type + '-' + value + ' ' +
    container.className.replace(RegExp('display-' + type + '-[a-z]+ ?'), '');
  event && event.preventDefault();
}

// If we are coming to the page with a hash in it (i.e. from a search, for example), try to get
// us as close as possible to the correct platform and dev os using the hashtag and block walk up.
var foundHash = false;
if (window.location.hash !== '' && window.location.hash !== 'content') { // content is default
  var hashLinks = document.querySelectorAll('a.hash-link');
  for (var i = 0; i < hashLinks.length && !foundHash; ++i) {
    if (hashLinks[i].hash === window.location.hash) {
      var parent = hashLinks[i].parentElement;
      while (parent) {
        if (parent.tagName === 'BLOCK') {
          var devOS = null;
          var targetPlatform = null;
          // Could be more than one target os and dev platform, but just choose some sort of order
          // of priority here.

          // Dev OS
          if (parent.className.indexOf('mac') > -1) {
            devOS = 'mac';
          } else if (parent.className.indexOf('linux') > -1) {
            devOS = 'linux';
          } else if (parent.className.indexOf('windows') > -1) {
            devOS = 'windows';
          } else {
            break; // assume we don't have anything.
          }

          // Target Platform
          if (parent.className.indexOf('ios') > -1) {
            targetPlatform = 'ios';
          } else if (parent.className.indexOf('android') > -1) {
            targetPlatform = 'android';
          } else {
            break; // assume we don't have anything.
          }
          // We would have broken out if both targetPlatform and devOS hadn't been filled.
          display('os', devOS);
          display('platform', targetPlatform);      
          foundHash = true;
          break;
        }
        parent = parent.parentElement;
      }
    }
  }
}
// Do the default if there is no matching hash
if (!foundHash) {
  var isMac = navigator.platform === 'MacIntel';
  var isWindows = navigator.platform === 'Win32';
  display('os', isMac ? 'mac' : (isWindows ? 'windows' : 'linux'));
  display('platform', isMac ? 'ios' : 'android');
}
</script>
