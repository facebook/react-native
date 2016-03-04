---
id: android-setup
title: Android Setup
layout: docs
category: Quick Start
permalink: docs/android-setup.html
next: linux-windows-support
---

This guide describes basic steps of the Android development environment setup that are required to run React Native android apps on an android emulator.

### Install Git

  - **On Mac**, if you have installed [XCode](https://developer.apple.com/xcode/), Git is already installed, otherwise run the following:

         brew install git

  - **On Linux**, install Git [via your package manager](https://git-scm.com/download/linux).

  - **On Windows**, download and install [Git for Windows](https://git-for-windows.github.io/). During the setup process, choose "Run Git from Windows Command Prompt", which will add Git to your `PATH` environment variable.

### Install the Android SDK (unless you already have it)

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

__NOTE__: You need to restart the Command Prompt (Windows) / Terminal Emulator (Mac OS X, Linux) to apply the new Environment variables.


### Use gradle daemon

React Native Android use [gradle](https://docs.gradle.org) as a build system. We recommend to enable gradle daemon functionality which may result in up to 50% improvement in incremental build times for changes in java code. Learn [here](https://docs.gradle.org/2.9/userguide/gradle_daemon.html) how to enable it for your platform.

### Configure your SDK

1. Open the Android SDK Manager (**on Mac** start a new shell and run `android`); in the window that appears make sure you check:
  * Android SDK Build-tools version 23.0.1
  * Android 6.0 (API 23)
  * Android Support Repository
2. Click "Install Packages"

![SDK Manager window](img/AndroidSDK1.png) ![SDK Manager window](img/AndroidSDK2.png)

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
3. [Configure hardware acceleration (HAXM)](http://developer.android.com/tools/devices/emulator.html#vm-mac), otherwise the emulator is going to be slow (or may not run at all).
  * On a mac this is typically requires opening: `/usr/local/opt/android-sdk/extras/intel/Hardware_Accelerated_Execution_Manager/IntelHAXM_<version>.dmg` and installing the package within.
4. Create an Android Virtual Device (AVD):
  1. Run `android avd` and click on **Create...**
  ![Create AVD dialog](img/CreateAVD.png)
  2. With the new AVD selected, click `Start...`
5. To bring up the developer menu press F2 (or install [Frappé](http://getfrappe.com))

### Windows Hyper-V Alternative

The [Visual Studio Emulator for Android](https://www.visualstudio.com/en-us/features/msft-android-emulator-vs.aspx) is a free android emulator that is hardware accelerated via Hyper-V. It doesn't require you to install Visual Studio at all.

To use it with react-native you just have to add a key and value to your registry:

1. Open the Run Command (Windows+R)
2. Enter `regedit.exe`
3. In the Registry Editor navigate to `HKEY_LOCAL_MACHINE\SOFTWARE\Wow6432Node\Android SDK Tools`
4. Right Click on `Android SDK Tools` and choose `New > String Value`
5. Set the name to `Path`
6. Double Click the new `Path` Key and set the value to `C:\Program Files\Android\sdk`. The path value might be different on your machine.

You will also need to run the command `adb reverse tcp:8081 tcp:8081` with this emulator.

Then restart the emulator and when it runs you can just do `react-native run-android` as usual.

### Editing your app's Java code in Android Studio

You can use any editor to edit JavaScript. If you want to use Android Studio to work on native code, from the Welcome screen of Android Studio choose "Import project" and select the `android` folder of your app.
