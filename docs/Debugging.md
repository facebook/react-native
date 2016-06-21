---
id: debugging
title: Debugging
layout: docs
category: Guides
permalink: docs/debugging.html
next: testing
---

## Accessing the In-App Developer Menu

You can access the developer menu by shaking your device or by selecting "Shake Gesture" inside the Hardware menu in the iOS Simulator. You can also use the `Command⌘ + D` keyboard shortcut when your app is running in the iPhone Simulator, or `Command⌘ + M` when running in an Android emulator.

![](img/DeveloperMenu.png)

> The Developer Menu is disabled in release (production) builds.

## Reloading JavaScript

Selecting `Reload` from the Developer Menu will reload the JavaScript that powers your application. You can also press `Command⌘ + R` in the iOS Simulator, or press `R` twice on Android emulators.

> If you are using a Dvorak/Colemak layout, use the `Command⌘ + P` keyboard shortcut to reload the simulator.

You will need to rebuild your app for changes to take effect in certain situations:

* You have added new resources to your native app's bundle, such as an image in `Images.xcassets` on iOS or in `res/drawable` folder on Android.
* You have modified native code (Objective-C/Swift on iOS or Java/C++ on Android).

> If the `Command⌘ + R` keyboard shortcut does not seem to reload the iOS Simulator, go to the Hardware menu, select Keyboard, and make sure that "Connect Hardware Keyboard" is checked.

### Automatic reloading

You may enable Live Reload to automatically trigger a reload whenever your JavaScript code changes.

Live Reload is available on iOS via the Developer Menu. On Android, select "Dev Settings" from the Developer Menu and enable "Auto reload on JS change".

## In-app Errors and Warnings

Errors and warnings are displayed inside your app in development builds.

### Errors

In-app errors are displayed in a full screen alert with a red background inside your app. This screen is known as a RedBox. You can use `console.error()` to manually trigger one.

### Warnings

Warnings will be displayed on screen with a yellow background. These alerts are known as YellowBoxes. Click on the alerts to show more information or to dismiss them.

As with a RedBox, you can use `console.warn()` to trigger a YellowBox.

YellowBoxes can be disabled during development by using `console.disableYellowBox = true;`. Specific warnings can be ignored programmatically by setting an array of prefixes that should be ignored: `console.ignoredYellowBox = ['Warning: ...'];`

> RedBoxes and YellowBoxes are automatically disabled in release (production) builds.

## Accessing logs

To view detailed logs on iOS, open your app in Xcode, then Build and Run your app on a device or the iPhone Simulator. The console should appear automatically after the app launches. If your app is failing to build, check the Issues Navigator in Xcode.

Run `adb logcat *:S ReactNative:V ReactNativeJS:V` in a terminal to display the logs for an Android app running on a device or an emulator.

## Chrome Developer Tools

To debug the JavaScript code in Chrome, select `Debug JS Remotely` from the Developer Menu. This will open a new tab at [http://localhost:8081/debugger-ui](http://localhost:8081/debugger-ui).

In Chrome, press `Command⌘ + Option⌥ + I` or select `View` → `Developer` → `Developer Tools` to toggle the developer tools console. Enable [Pause On Caught Exceptions](http://stackoverflow.com/questions/2233339/javascript-is-there-a-way-to-get-chrome-to-break-on-all-errors/17324511#17324511) for a better debugging experience.

### Debugging on a device with Chrome Developer Tools

On iOS devices, open the file [`RCTWebSocketExecutor.m`](https://github.com/facebook/react-native/blob/master/Libraries/WebSocket/RCTWebSocketExecutor.m) and change `localhost` to the IP address of your computer, then select `Debug JS Remotely` from the Developer Menu.

On Android 5.0+ devices connected via USB, you can use the [`adb` command line tool](http://developer.android.com/tools/help/adb.html) to setup port forwarding from the device to your computer:

`adb reverse tcp:8081 tcp:8081`

Alternatively, select `Dev Settings` from the Developer Menu, then update the `Debug server host for device` setting to match the IP address of your computer.

> If you run into any issues, it may be possible that one of your Chrome extensions is interacting in unexpected ways with the debugger. Try disabling all of your extensions and re-enabling them one-by-one until you find the problematic extension.

### Debugging using a custom JavaScript debugger

To use a custom JavaScript debugger in place of Chrome Developer Tools, set the `REACT_DEBUGGER` environment variable to a command that will start your custom debugger. You can then select `Debug JS Remotely` from the Developer Menu to start debugging.

> The debugger will receive a list of all project roots, separated by a space. For example, if you set `REACT_DEBUGGER="node /path/to/launchDebugger.js --port 2345 --type ReactNative"`, then the command `node /path/to/launchDebugger.js --port 2345 --type ReactNative /path/to/reactNative/app` will be used to start your debugger. Custom debugger commands executed this way should be short-lived processes, and they shouldn't produce more than 200 kilobytes of output.

## FPS (Frames per Second) Monitor

You can enable a FPS graph overlay in the Developer Menu in order to help you debug performance problems.
