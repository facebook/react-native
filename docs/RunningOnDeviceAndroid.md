---
id: running-on-device-android
title: Running On Device
layout: docs
category: Guides (Android)
permalink: docs/running-on-device-android.html
next: embedded-app-android
---

## Prerequisite: USB Debugging

You'll need this in order to install your app on your device. First, make sure you have [USB debugging enabled on your device](https://www.google.com/search?q=android+Enable+USB+debugging).

Check that your device has been **successfully connected** by running `adb devices`:

    $ adb devices
    List of devices attached
    emulator-5554 offline   # Google emulator
    14ed2fcc device         # Physical device

Seeing **device** in the right column means the device is connected. Android - go figure :) You must have **only one device connected**.

Now you can use `react-native run-android` to install and launch your app on the device.

## Accessing development server from device

You can also iterate quickly on device using the development server. Follow one of the steps described below to make your development server running on your laptop accessible for your device.

> Hint
>
> Most modern android devices don't have a hardware menu button, which we use to trigger the developer menu. In that case you can shake the device to open the dev menu (to reload, debug, etc.). Alternatively, you can run the command `adb shell input keyevent 82` to open the dev menu (82 being the [Menu](http://developer.android.com/reference/android/view/KeyEvent.html#KEYCODE_MENU) key code).

### Using adb reverse

> Note that this option is available on devices running android 5.0+ (API 21).

Have your device connected via USB with debugging enabled (see paragraph above on how to enable USB debugging on your device).

1. Run `adb reverse tcp:8081 tcp:8081`
2. You can use `Reload JS` and other development options with no extra configuration

### Configure your app to connect to the local dev server via Wi-Fi

1. Make sure your laptop and your phone are on the **same Wi-Fi network**.
2. Open your React Native app on your device. You can do this the same way you'd open any other app.
3. You'll see a red screen with an error. This is OK. The following steps will fix that.
4. Open the **Developer menu** by shaking the device or running `adb shell input keyevent 82` from the command line.
5. Go to `Dev Settings`.
6. Go to `Debug server host for device`.
7. Type in your machine's IP address and the port of the local dev server (e.g. 10.0.1.1:8081). **On Mac**, you can find the IP address in System Preferences / Network. **On Windows**, open the command prompt and type `ipconfig` to find your machine's IP address ([more info](http://windows.microsoft.com/en-us/windows/using-command-line-tools-networking-information)).
8. Go back to the **Developer menu** and select `Reload JS`.
