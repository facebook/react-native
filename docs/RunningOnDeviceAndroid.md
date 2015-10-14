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

### Configure device to connect to the dev server via Wi-Fi

To do that, your laptop and your phone have to be on the same wifi network.

1. Open rage shake menu (shake the device) or run `adb shell input keyevent 82`
2. Go to `Dev Settings`
3. Go to `Debug server host for device`
4. Type in your machine's IP address and the port of the packager and `Reload JS`
