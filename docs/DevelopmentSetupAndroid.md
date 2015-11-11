---
id: android-setup
title: Android Setup
layout: docs
category: Quick Start
permalink: docs/android-setup.html
next: linux-windows-support
---

This guide describes basic steps of the Android development environment setup that are required to run React Native android apps on an android emulator. We don't discuss developer tool configuration such as IDEs here.

### Install the Android SDK (unless you have it)

1. [Install the latest JDK](http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html)
2. Install the Android SDK:
     - **On Mac**: `brew install android-sdk`
     - **On Linux and Windows**: [Download from the Android website](https://developer.android.com/sdk/installing/index.html)

### Define the ANDROID_HOME environment variable

__IMPORTANT__: Make sure the `ANDROID_HOME` environment variable points to your existing Android SDK:

  - **On Mac**, add this to your `~/.bashrc`, `~/.bash_profile` or whatever your shell uses:

        # If you installed the SDK via Homebrew, otherwise ~/Library/Android/sdk
        export ANDROID_HOME=/usr/local/opt/android-sdk
  - **On Linux**, add this to your `~/.bashrc`, `~/.bash_profile` or whatever your shell uses:
        
        export ANDROID_HOME=<path_where_you_unpacked_android_sdk>

  - **On Windows**, go to `Control Panel` -> `System and Security` -> `System` -> `Change settings` -> `Advanced` -> `Environment variables` -> `New`

### Configure your SDK

1. Open the Android SDK Manager (**on Mac** start a new shell and run `android`); in the window that appears make sure you check:
  * Android SDK Build-tools version 23.0.1
  * Android 6.0 (API 23)
  * Android Support Repository
2. Click "Install Packages"

![SDK Manager window](/react-native/img/AndroidSDK1.png) ![SDK Manager window](/react-native/img/AndroidSDK2.png)

### Install Genymotion

Genymotion is much easier to set up than stock Google emulators. However, it's only free for personal use. If you want to use the stock Google emulator, see below.

1. Download and install [Genymotion](https://www.genymotion.com/).
2. Open Genymotion. It might ask you to install VirtualBox unless you already have it.
3. Create a new emulator and start it.
4. To bring up the developer menu press ⌘+M

### Alternative: Create a stock Google emulator

1. Start a new shell and run `android`; in the window that appears make sure you check:
  * Intel x86 Atom System Image (for Android 5.1.1 - API 22)
  * Intel x86 Emulator Accelerator (HAXM installer)
2. Click "Install Packages".
3. [Configure hardware acceleration (HAXM)](http://developer.android.com/tools/devices/emulator.html#vm-mac), otherwise the emulator is going to be slow.
4. Create an Android Virtual Device (AVD):
  1. Run `android avd` and click on **Create...**
  ![Create AVD dialog](/react-native/img/CreateAVD.png)
  2. With the new AVD selected, click `Start...`
5. To bring up the developer menu press F2
