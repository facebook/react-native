---
id: android-setup
title: Android Setup
layout: docs
category: Quick Start
permalink: docs/android-setup.html
next: tutorial
---

This guide describes basic steps of the android development environment setup that are required to run React Native android apps on an android emulator. We don't discuss developer tool configuration such as IDEs here.

These instructions only cover installation "from scratch". If you happen to have some old, outdated version of Android SDK make sure to update required packages to the version mentioned below and install all the missing ones and make sure `ANDROID_HOME` points to your existing SDK.

### Install and configure SDK

1. [Install the latest JDK](http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html).
2. Install the Android SDK with `brew install android-sdk`.
3. Add this to your `~/.bashrc`, `~/.zshrc` or whatever your shell uses:
        export ANDROID_HOME=/usr/local/opt/android-sdk
4. Start a new shell and run `android`; in the window that appears make sure you check:
  * Android SDK Build-tools version 23.0.1
  * Android 6.0 (API 23)
  * Android Support Repository
5. Click "Install Packages".

### Install and run Android stock emulator

1. Start a new shell and run `android`; in the window that appears make sure you check:
  * Intel x86 Atom System Image (for Android 5.1.1 - API 22)
  * Intel x86 Emulator Accelerator (HAXM installer)
  ![SDK Manager window](/react-native/img/AndroidSDK1.png) ![SDK Manager window](/react-native/img/AndroidSDK2.png)
2. Click "Install Packages".
3. [Configure HAXM](http://developer.android.com/tools/devices/emulator.html#vm-mac).
4. Create an Android Virtual Device (AVD) to use with the Android emulator:
  1. Run `android avd` and click on **Create...**
  ![Create AVD dialog](/react-native/img/CreateAVD.png)
  2. With the new AVD selected, click `Start...`
