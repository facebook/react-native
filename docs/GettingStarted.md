---
id: quick-start-getting-started
title: Getting Started
layout: docs
category: The Basics
permalink: docs/getting-started.html
next: tutorial
---

Welcome to React Native! This page will help you install React Native on
your system, so that you can build apps with it right away. If you already
have React Native installed, you can skip ahead to the
[Tutorial](docs/tutorial.html).

The instructions are a bit different depending on your development operating system, and whether you want to start developing for iOS or Android. If you
want to develop for both iOS and Android, that's fine - you just have to pick
one to start with, since the setup is a bit different.

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
    }
  </style>
  <span>Mobile OS:</span>
  <a href="javascript:void(0);" class="button-ios" onclick="display('platform', 'ios')">iOS</a>
  <a href="javascript:void(0);" class="button-android" onclick="display('platform', 'android')">Android</a>
  <br />
  <span>Development OS:</span>
  <a href="javascript:void(0);" class="button-mac" onclick="display('os', 'mac')">macOS</a>
  <a href="javascript:void(0);" class="button-linux" onclick="display('os', 'linux')">Linux</a>
  <a href="javascript:void(0);" class="button-windows" onclick="display('os', 'windows')">Windows</a>
</div>

<block class="linux windows ios" />

## Unsupported

<div>Unfortunately, Apple only lets you develop for iOS on a Mac. If you want to build an iOS app but you don't have a Mac yet, you can try starting with the <a href="" onclick="display('platform', 'android')">Android</a> instructions instead.</div>

<center><img src="img/react-native-sorry-not-supported.png" width="150"></img></center>

<block class="mac ios" />

## Installing Dependencies

You will need Node, Watchman, the React Native command line interface, and Xcode.

<block class="mac android" />

## Installing Dependencies

You will need Node, Watchman, the React Native command line interface, a JDK, and Android Studio.

<block class="linux android" />

## Installing Dependencies

You will need Node, the React Native command line interface, a JDK, and Android Studio.

<block class="windows android" />

## Installing Dependencies

You will need Node, the React Native command line interface, Python2, a JDK, and Android Studio.

<block class="mac ios android" />

### Node, Watchman

We recommend installing Node and Watchman using [Homebrew](http://brew.sh/). Run the following commands in a Terminal after installing Homebrew:

```
brew install node
brew install watchman
```

If you have already installed Node on your system, make sure it is version 4 or newer.

[Watchman](https://facebook.github.io/watchman) is a tool by Facebook for watching changes in the filesystem. It is highly recommended you install it for better performance.

<block class="linux android" />

### Node

Follow the [installation instructions for your Linux distribution](https://nodejs.org/en/download/package-manager/) to install Node 4 or newer.

<block class='windows android' />

### Node, Python2, JDK

We recommend installing Node and Python2 via [Chocolatey](https://chocolatey.org), a popular package manager for Windows.

Android Studio, which we will install next, requires a recent version of the [Java SE Development Kit (JDK)](http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html) which can be installed using Chocolatey.

Open a Command Prompt as Administrator, then run:

```
choco install nodejs.install
choco install python2
choco install jdk8
```

If you have already installed Node on your system, make sure it is version 4 or newer. If you already have a JDK on your system, make sure it is version 8 or newer.

> You can find additional installation options on [Node.js's Downloads page](https://nodejs.org/en/download/).

<block class="mac ios android" />

### The React Native CLI

Node comes with npm, which lets you install the React Native command line interface.

Run the following command in a Terminal:

```
npm install -g react-native-cli
```

> If you get an error like `Cannot find module 'npmlog'`, try installing npm directly: `curl -0 -L https://npmjs.org/install.sh | sudo sh`.

<block class="windows linux android" />

### The React Native CLI

Node comes with npm, which lets you install the React Native command line interface.

Run the following command in a Terminal:

```
npm install -g react-native-cli
```

> If you get an error like `Cannot find module 'npmlog'`, try installing npm directly: `curl -0 -L https://npmjs.org/install.sh | sudo sh`.

<block class="mac ios" />

### Xcode

The easiest way to install Xcode is via the [Mac App Store](https://itunes.apple.com/us/app/xcode/id497799835?mt=12). Installing Xcode will also install the iOS Simulator and all the necessary tools to build your iOS app.

If you have already installed Xcode on your system, make sure it is version 8 or higher.

You will also need to install the Xcode Command Line Tools. Open Xcode, then choose "Preferences..." from the Xcode menu. Go to the Locations panel and install the tools by selecting the most recent version in the Command Line Tools dropdown.

![Xcode Command Line Tools](img/XcodeCommandLineTools.png)

<block class="mac linux windows android" />

### Android Development Environment

Setting up your development environment can be somewhat tedious if you're new to Android development. If you're already familiar with Android development, there are a few things you may need to configure. In either case, please make sure to carefully follow the next few steps.

<block class="mac linux android" />

> Android Studio requires a recent version of the [Java SE Development Kit (JDK)](http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html). Go ahead and install JDK 8 or newer if needed.

<block class="mac linux windows android" />

#### 1. Download and install Android Studio

Android Studio provides the Android SDK and AVD (emulator) required to run and test your React Native apps. [Download Android Studio](https://developer.android.com/studio/index.html), then follow the [installation instructions](https://developer.android.com/studio/install.html). Choose `Custom` installation when prompted by the Setup Wizard, and proceed to the next step.

<block class="mac windows android" />

#### 2. Install the AVD and HAXM

Android Virtual Devices allow you to run Android apps on your computer without the need for an actual Android phone or tablet. Choose `Custom` installation when running Android Studio for the first time. Make sure the boxes next to all of the following are checked:

- `Android SDK`
- `Android SDK Platform`
- `Performance (Intel ® HAXM)`
- `Android Virtual Device`

Then, click "Next" to install all of these components.

> If you've already installed Android Studio before, you can still install HAXM ([Windows](https://software.intel.com/en-us/android/articles/installation-instructions-for-intel-hardware-accelerated-execution-manager-windows)|[Mac](https://software.intel.com/en-us/android/articles/installation-instructions-for-intel-hardware-accelerated-execution-manager-mac-os-x)) without performing a custom installation.

<block class="linux android" />

#### 2. Install the AVD and configure VM acceleration

Android Virtual Devices allow you to run Android apps on your computer without the need for an actual Android phone or tablet. Choose `Custom` installation when running Android Studio for the first time. Make sure the boxes next to all of the following are checked:

- `Android SDK`
- `Android SDK Platform`
- `Android Virtual Device`

Click "Next" to install all of these components, then [configure VM acceleration](https://developer.android.com/studio/run/emulator-acceleration.html#vm-linux) on your system.

<block class="mac linux windows android" />

#### 3. Install the Android 6.0 (Marshmallow) SDK

Android Studio installs the most recent Android SDK by default. React Native, however, requires the `Android 6.0 (Marshmallow)` SDK. To install it, launch the SDK Manager, click on "Configure" > "SDK Manager" in the "Welcome to Android Studio" screen.

> The SDK Manager can also be found within the Android Studio "Preferences" menu, under **Appearance & Behavior** → **System Settings** → **Android SDK**.

Select the "SDK Platforms" tab from within the SDK Manager, then check the box next to "Show Package Details" in the bottom right corner. Look for and expand the `Android 6.0 (Marshmallow)` entry, then make sure the following items are all checked:

- `Google APIs`
- `Android SDK Platform 23`
- `Intel x86 Atom_64 System Image`
- `Google APIs Intel x86 Atom_64 System Image`

![Android SDK Manager](img/AndroidSDKManager.png)

Next, select the "SDK Tools" tab and check the box next to "Show Package Details" here as well. Look for and expand the "Android SDK Build Tools" entry, then make sure that `Android SDK Build-Tools 23.0.1` is selected.

Finally, click "Apply" to download and install the Android SDK and related build tools.

<block class="mac windows linux android" />

#### 4. Set up the ANDROID_HOME environment variable

The React Native command line interface requires the `ANDROID_HOME` environment variable to be set up.

<block class="mac android" />

Add the following lines to your `~/.profile` (or equivalent) config file:

```
export ANDROID_HOME=${HOME}/Library/Android/sdk
export PATH=${PATH}:${ANDROID_HOME}/tools
export PATH=${PATH}:${ANDROID_HOME}/platform-tools
```

Type `source ~/.profile` to load the config into your current shell.

> Please make sure you export the correct path for `ANDROID_HOME`. If you installed the Android SDK using Homebrew, it would be located at `/usr/local/opt/android-sdk`.

<block class="linux android" />

Add the following lines to your `~/.profile` (or equivalent) config file:

```
export ANDROID_HOME=${HOME}/Android/Sdk
export PATH=${PATH}:${ANDROID_HOME}/tools
export PATH=${PATH}:${ANDROID_HOME}/platform-tools
```

Type `source ~/.profile` to load the config into your current shell.

> Please make sure you export the correct path for `ANDROID_HOME` if you did not install the Android SDK using Android Studio.

<block class="windows android" />

Go to **Control Panel** → **System and Security** → **System** → **Change settings** →
**Advanced System Settings** → **Environment variables** → **New**, then enter the path to your Android SDK.

![env variable](img/react-native-android-sdk-environment-variable-windows.png)

Restart the Command Prompt to apply the new environment variable.

> Please make sure you export the correct path for `ANDROID_HOME` if you did not install the Android SDK using Android Studio.

<block class="linux android" />

### Watchman (optional)

Follow the [Watchman installation guide](https://facebook.github.io/watchman/docs/install.html#build-install) to compile and install Watchman from source.

> [Watchman](https://facebook.github.io/watchman/docs/install.html) is a tool by Facebook for watching
changes in the filesystem. It is highly recommended you install it for better performance, but it's alright to skip this if you find the process to be tedious.

<block class="mac windows linux android" />

## Starting the Android Virtual Device

![Android Studio AVD Manager](img/react-native-tools-avd.png)

You can see the list of available AVDs by opening the "AVD Manager" from within Android Studio.

Once in the "AVD Manager", select your AVD and click "Edit...". Choose "Android 6.0 - API Level 23" under Device, and "Intel Atom (x86_64)" under CPU/ABI. Click OK, then select your new AVD and click "Start...", and finally, "Launch".

![Android AVD Configuration](img/AndroidAVDConfiguration.png)

> It is very common to run into an issue where Android Studio fails to create a default AVD. You may follow the [Android Studio User Guide](https://developer.android.com/studio/run/managing-avds.html) to create a new AVD manually if needed.

### Using a real device

If you have a physical Android device, you can use it for development in place of an AVD. Plug it in to your computer using a USB cable and [enable USB debugging](https://developer.android.com/training/basics/firstapp/running-app.html) before proceeding to the next step.

<block class="mac ios android" />

## Testing your React Native Installation

<block class="mac ios" />

Use the React Native command line interface to generate a new React Native project called "AwesomeProject", then run `react-native run-ios` inside the newly created folder.

```
react-native init AwesomeProject
cd AwesomeProject
react-native run-ios
```

You should see your new app running in the iOS Simulator shortly.

![AwesomeProject on iOS](img/iOSSuccess.png)

`react-native run-ios` is just one way to run your app. You can also run it directly from within Xcode or [Nuclide](https://nuclide.io/).

<block class="mac android" />

Use the React Native command line interface to generate a new React Native project called "AwesomeProject", then run `react-native run-android` inside the newly created folder:

```
react-native init AwesomeProject
cd AwesomeProject
react-native run-android
```

If everything is set up correctly, you should see your new app running in your Android emulator shortly.

![AwesomeProject on Android](img/AndroidSuccess.png)

`react-native run-android` is just one way to run your app - you can also run it directly from within Android Studio or [Nuclide](https://nuclide.io/).

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

<block class="windows android" />

## Testing your React Native Installation

Use the React Native command line interface to generate a new React Native project called "AwesomeProject", then run `react-native run-android` inside the newly created folder:

```
react-native init AwesomeProject
cd AwesomeProject
react-native run-android
```

<block class="linux android" />

## Testing your React Native Installation

Use the React Native command line interface to generate a new React Native project called "AwesomeProject", then run `react-native run-android` inside the newly created folder.

```
react-native init AwesomeProject
cd AwesomeProject
react-native run-android
```

<block class="windows linux android" />

If everything is set up correctly, you should see your new app running in your Android emulator shortly.

![AwesomeProject on Android](img/AndroidSuccess.png)

<block class="windows linux android" />

### Modifying your app

Now that you have successfully run the app, let's modify it.

- Open `index.android.js` in your text editor of choice and edit some lines.
- Press the `R` key twice or select `Reload` from the Developer Menu to see your change!

### That's it!

Congratulations! You've successfully run and modified a React Native app.

<center><img src="img/react-native-congratulations.png" width="150"></img></center>

<block class="mac ios" />

## Now What?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](docs/integration-with-existing-apps.html).

- If you can't get this to work, see the [Troubleshooting](docs/troubleshooting.html#content) page.

- If you're curious to learn more about React Native, continue on
to the [Tutorial](docs/tutorial.html).

<block class="windows linux mac android" />

## Now What?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](docs/integration-with-existing-apps.html).

- If you can't get this to work, see the [Troubleshooting](docs/troubleshooting.html#content) page.

- If you're curious to learn more about React Native, continue on
to the [Tutorial](docs/tutorial.html).

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
