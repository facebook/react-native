---
id: running-on-device-android
title: Running On Device
layout: docs
category: Guides (Android)
permalink: docs/running-on-device-android.html
next: embedded-app-android
---

## USB Debugging

The easiest way to develop on a device is by USB debugging. First, make sure you have [USB debugging enabled on your device](https://www.google.com/search?q=android+Enable+USB+debugging). Once debugging is enabled on the device you can use `react-native run-android` in the same way as with emulator to install and launch your React Native app on the connected device.

## Accessing development server from device

You can also iterate quickly on device using the development server. Follow one of the steps described below to make your development server running on your laptop accessible for your device.

> Hint
>
> Most modern android devices don't have a hardware menu button, which we use to trigger the developer menu. In that case you can shake the device to open the dev menu (reload, debug, etc.)

### Using adb reverse

> Note that this option is available on devices running android 5.0+ (API 21).

Have your device connected via USB with debugging enabled (see paragraph above on how to enable USB debugging on your device).

1. Run `adb reverse tcp:8081 tcp:8081`
2. You can use `Reload JS` and other development options with no extra configuration

### Configure your app to connect to the local dev server via Wi-Fi

1. Make sure your laptop and your phone are on the same Wi-Fi network.
2. Open your React Native app on your device.
3. You'll see a red screen with an error. This is OK. The following steps will fix that.
4. Open the **Developer menu** by shaking the device or running `adb shell input keyevent 82` from the command line.
5. Go to `Dev Settings`.
6. Go to `Debug server host for device`.
7. Type in your machine's IP address and the port of the local dev server (e.g. 10.0.1.1:8081). **On Mac**, you can find the IP address in System Preferences / Network. **On Windows**, open the command prompt and type `ipconfig` to find your machine's IP address ([more info](http://windows.microsoft.com/en-us/windows/using-command-line-tools-networking-information)).
8. Go back to the **Developer menu** and select `Reload JS`.
