---
id: debugging
title: Debugging
layout: docs
category: Guides
permalink: docs/debugging.html
next: testing
---

## Debugging React Native Apps
To access the in-app developer menu:

1. On iOS shake the device or press `control + ⌘ + z` in the simulator.
2. On Android shake the device or press hardware menu button (available on older devices and in most of the emulators, e.g. in [genymotion](https://www.genymotion.com) you can press `⌘ + m` or `F2` to simulate hardware menu button click). You can also install [Frappé](http://getfrappe.com), a tool for OS X, which allows you to emulate shaking of devices remotely. You can use `⌘ + Shift + R` as a shortcut to trigger a **shake** from Frappé.

> Hint

> To disable the developer menu for production builds:
>
> 1. For iOS open your project in Xcode and select `Product` → `Scheme` → `Edit Scheme...` (or press `⌘ + <`). Next, select `Run` from the menu on the left and change the Build Configuration to `Release`.
> 2. For Android, by default, developer menu will be disabled in release builds done by gradle (e.g with gradle `assembleRelease` task). Although this behavior can be customized by passing proper value to `ReactInstanceManager#setUseDeveloperSupport`.

### Android logging
Run `adb logcat *:S ReactNative:V ReactNativeJS:V` in a terminal to see your Android app's logs.

### Reload
Selecting `Reload` (or pressing `⌘ + r` in the iOS simulator) will reload the JavaScript that powers your application. If you have added new resources (such as an image to `Images.xcassets` on iOS or to `res/drawable` folder on Android) or modified any native code (Objective-C/Swift code on iOS or Java/C++ code on Android), you will need to re-build the app for the changes to take effect.

### YellowBox/RedBox
Using `console.warn` will display an on-screen log on a yellow background. Click on this warning to show more information about it full screen and/or dismiss the warning.

You can use `console.error` to display a full screen error on a red background.

By default, the warning box is enabled in `__DEV__`. Set the following flag to disable it:
```js
console.disableYellowBox = true;
console.warn('YellowBox is disabled.');
```
Specific warnings can be ignored programmatically by setting the array:
```js
console.ignoredYellowBox = ['Warning: ...'];
```
Strings in `console.ignoredYellowBox` can be a prefix of the warning that should be ignored.

### Chrome Developer Tools
To debug the JavaScript code in Chrome, select `Debug JS Remotely` from the developer menu. This will open a new tab at [http://localhost:8081/debugger-ui](http://localhost:8081/debugger-ui).

In Chrome, press `⌘ + option + i` or select `View` → `Developer` → `Developer Tools` to toggle the developer tools console. Enable [Pause On Caught Exceptions](http://stackoverflow.com/questions/2233339/javascript-is-there-a-way-to-get-chrome-to-break-on-all-errors/17324511#17324511) for a better debugging experience.

To debug on a real device:

1. On iOS - open the file `RCTWebSocketExecutor.m` and change `localhost` to the IP address of your computer. Shake the device to open the development menu with the option to start debugging.
2. On Android, if you're running Android 5.0+ device connected via USB you can use `adb` command line tool to setup port forwarding from the device to your computer. For that run: `adb reverse tcp:8081 tcp:8081` (see [this link](http://developer.android.com/tools/help/adb.html) for help on `adb` command). Alternatively, you can [open dev menu](#debugging-react-native-apps) on the device and select `Dev Settings`, then update `Debug server host for device` setting to the IP address of your computer.

### Custom JavaScript debugger
To use a custom JavaScript debugger define the `REACT_DEBUGGER` environment variable to a command that will start your custom debugger. That variable will be read from the Packager process. If that environment variable is set, selecting `Debug JS Remotely` from the developer menu will execute that command instead of opening Chrome. The exact command to be executed is the contents of the REACT_DEBUGGER environment variable followed by the space separated paths of all project roots (e.g. If you set REACT_DEBUGGER="node /path/to/launchDebugger.js --port 2345 --type ReactNative" then the command "node /path/to/launchDebugger.js --port 2345 --type ReactNative /path/to/reactNative/app" will end up being executed). Custom debugger commands executed this way should be short-lived processes, and they shouldn't produce more than 200 kilobytes of output.

### Live Reload
This option allows for your JS changes to trigger automatic reload on the connected device/emulator. To enable this option:

1. On iOS, select `Enable Live Reload` via the developer menu to have the application automatically reload when changes are made to the JavaScript.
2. On Android, [launch dev menu](#debugging-react-native-apps), go to `Dev Settings` and select `Auto reload on JS change` option

### FPS (Frames per Second) Monitor
On `0.5.0-rc` and higher versions, you can enable a FPS graph overlay in the developers menu in order to help you debug performance problems.
