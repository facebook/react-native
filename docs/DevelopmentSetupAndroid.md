---
id: android-setup
title: Android Setup
layout: docs
category: Quick Start
permalink: docs/android-setup.html
next: tutorial
---

__NOTE__: This guide needs to be extended for Windows. Can you send us a pull request?

This guide describes basic steps of the Android development environment setup that are required to run React Native android apps on an android emulator. We don't discuss developer tool configuration such as IDEs here.

### If already have the Android SDK

1. __IMPORTANT__: Make sure the `ANDROID_HOME` environment variable points to your existing Android SDK
2. Make sure to update the required packages to the versions mentioned below (see screenshots)

### If you don't have the Android SDK

1. [Install the latest JDK](http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html)
2. Install the Android SDK with `brew install android-sdk`
3. Add this to your `~/.bashrc`, `~/.zshrc` or whatever your shell uses:
        export ANDROID_HOME=/usr/local/opt/android-sdk

### Configure your SDK

1. Start a new shell and run `android`; in the window that appears make sure you check:
  * Android SDK Build-tools version 23.0.1
  * Android 6.0 (API 23)
  * Android Support Repository
2. Click "Install Packages"

![SDK Manager window](/react-native/img/AndroidSDK1.png) ![SDK Manager window](/react-native/img/AndroidSDK2.png)

### Install Genymotion

1. Download and install [Genymotion](https://www.genymotion.com/)
2. Open Genymotion
3. Create a new emulator and start it
