---
id: debugging
title: Debugging
layout: docs
category: Guides
permalink: docs/debugging.html
next: accessibility
previous: platform-specific-code
---

## Enabling Keyboard Shortcuts

React Native supports a few keyboard shortcuts in the iOS Simulator. They are described below. To enable them, open the Hardware menu, select Keyboard, and make sure that "Connect Hardware Keyboard" is checked.

## Accessing the In-App Developer Menu

You can access the developer menu by shaking your device or by selecting "Shake Gesture" inside the Hardware menu in the iOS Simulator. You can also use the **`Command`**`⌘` + **`D`** keyboard shortcut when your app is running in the iPhone Simulator, or **`Command`**`⌘` + **`M`** when running in an Android emulator.

![](img/DeveloperMenu.png)

> The Developer Menu is disabled in release (production) builds.

## Reloading JavaScript

Instead of recompiling your app every time you make a change, you can reload your app's JavaScript code instantly. To do so, select "Reload" from the Developer Menu. You can also press **`Command`**`⌘` + **`R`** in the iOS Simulator, or press **`R`** twice on Android emulators.

### Automatic reloading

You can speed up your development times by having your app reload automatically any time your code changes. Automatic reloading can be enabled by selecting "Enable Live Reload" from the Developer Menu.

You may even go a step further and keep your app running as new versions of your files are injected into the JavaScript bundle automatically by enabling [Hot Reloading](https://facebook.github.io/react-native/blog/2016/03/24/introducing-hot-reloading.html) from the Developer Menu. This will allow you to persist the app's state through reloads.

> There are some instances where hot reloading cannot be implemented perfectly. If you run into any issues, use a full reload to reset your app.

You will need to rebuild your app for changes to take effect in certain situations:

* You have added new resources to your native app's bundle, such as an image in `Images.xcassets` on iOS or the `res/drawable` folder on Android.
* You have modified native code (Objective-C/Swift on iOS or Java/C++ on Android).

## In-app Errors and Warnings

Errors and warnings are displayed inside your app in development builds.

### Errors

In-app errors are displayed in a full screen alert with a red background inside your app. This screen is known as a RedBox. You can use `console.error()` to manually trigger one.

### Warnings

Warnings will be displayed on screen with a yellow background. These alerts are known as YellowBoxes. Click on the alerts to show more information or to dismiss them.

As with a RedBox, you can use `console.warn()` to trigger a YellowBox.

YellowBoxes can be disabled during development by using `console.disableYellowBox = true;`. Specific warnings can be ignored programmatically by setting an array of prefixes that should be ignored: `console.ignoredYellowBox = ['Warning: ...'];`.

In CI/Xcode, YellowBoxes can also be disabled by setting the `IS_TESTING` environment variable.

> RedBoxes and YellowBoxes are automatically disabled in release (production) builds.

## Chrome Developer Tools

To debug the JavaScript code in Chrome, select "Debug JS Remotely" from the Developer Menu. This will open a new tab at [http://localhost:8081/debugger-ui](http://localhost:8081/debugger-ui).

Select `Tools → Developer Tools` from the Chrome Menu to open the [Developer Tools](https://developer.chrome.com/devtools). You may also access the DevTools using keyboard shortcuts (**`Command`**`⌘` + **`Option`**`⌥` + **`I`** on Mac, **`Ctrl`** + **`Shift`** + **`I`** on Windows). You may also want to enable [Pause On Caught Exceptions](http://stackoverflow.com/questions/2233339/javascript-is-there-a-way-to-get-chrome-to-break-on-all-errors/17324511#17324511) for a better debugging experience.

### Debugging using a custom JavaScript debugger

To use a custom JavaScript debugger in place of Chrome Developer Tools, set the `REACT_DEBUGGER` environment variable to a command that will start your custom debugger. You can then select "Debug JS Remotely" from the Developer Menu to start debugging.

The debugger will receive a list of all project roots, separated by a space. For example, if you set `REACT_DEBUGGER="node /path/to/launchDebugger.js --port 2345 --type ReactNative"`, then the command `node /path/to/launchDebugger.js --port 2345 --type ReactNative /path/to/reactNative/app` will be used to start your debugger.

> Custom debugger commands executed this way should be short-lived processes, and they shouldn't produce more than 200 kilobytes of output.

## Performance Monitor

You can enable a performance overlay to help you debug performance problems by selecting "Perf Monitor" in the Developer Menu.

<hr style="margin-top:25px; margin-bottom:25px;"/>

# Debugging in Ejected Apps

<div class="banner-crna-ejected" style="margin-top:25px">
  <h3>Projects with Native Code Only</h3>
  <p>
    The remainder of this guide only applies to projects made with <code>react-native init</code>
    or to those made with Create React Native App which have since ejected. For
    more information about ejecting, please see
    the <a href="https://github.com/react-community/create-react-native-app/blob/master/EJECTING.md" target="_blank">guide</a> on
    the Create React Native App repository.
  </p>
</div>

## Accessing console logs

Note: if you're using Create React Native App, these already appear in the same terminal output as the packager.

You can display the console logs for an iOS or Android app by using the following commands in a terminal while the app is running:

```
$ react-native log-ios
$ react-native log-android
```

You may also access these through `Debug → Open System Log...` in the iOS Simulator or by running `adb logcat *:S ReactNative:V ReactNativeJS:V` in a terminal while an Android app is running on a device or emulator.

## Debugging on a device with Chrome Developer Tools

Note: if you're using Create React Native App, this is configured for you already.

On iOS devices, open the file [`RCTWebSocketExecutor.m`](https://github.com/facebook/react-native/blob/master/Libraries/WebSocket/RCTWebSocketExecutor.m) and change "localhost" to the IP address of your computer, then select "Debug JS Remotely" from the Developer Menu.

On Android 5.0+ devices connected via USB, you can use the [`adb` command line tool](http://developer.android.com/tools/help/adb.html) to setup port forwarding from the device to your computer:

`adb reverse tcp:8081 tcp:8081`

Alternatively, select "Dev Settings" from the Developer Menu, then update the "Debug server host for device" setting to match the IP address of your computer.

> If you run into any issues, it may be possible that one of your Chrome extensions is interacting in unexpected ways with the debugger. Try disabling all of your extensions and re-enabling them one-by-one until you find the problematic extension.

### Debugging with [Stetho](http://facebook.github.io/stetho/) on Android

Follow this guide to enable Stetho for Debug mode:

1. In `android/app/build.gradle`, add these lines in the `dependencies` section:

   ```gradle
    debugCompile 'com.facebook.stetho:stetho:1.5.0'
    debugCompile 'com.facebook.stetho:stetho-okhttp3:1.5.0'
   ```

> The above will configure Stetho v1.5.0. You can check at http://facebook.github.io/stetho/ if a newer version is available.

2. Create the following Java classes to wrap the Stetho call, one for release and one for debug:
   
    ```java
    // android/app/src/release/java/com/{yourAppName}/StethoWrapper.java
    
    public class StethoWrapper {

        public static void initialize(Context context) {
            // NO_OP
        }

        public static void addInterceptor() {
            // NO_OP
        }
    }
    ```

    ```java
    // android/app/src/debug/java/com/{yourAppName}/StethoWrapper.java

    public class StethoWrapper {
        public static void initialize(Context context) {
          Stetho.initializeWithDefaults(context);
        }

        public static void addInterceptor() {
          OkHttpClient client = OkHttpClientProvider.getOkHttpClient()
                 .newBuilder()
                 .addNetworkInterceptor(new StethoInterceptor())
                 .build();
          
          OkHttpClientProvider.replaceOkHttpClient(client);
        }
    }
    ```

3. Open `android/app/src/main/java/com/{yourAppName}/MainApplication.java` and replace the original `onCreate` function:

```java
  public void onCreate() {
      super.onCreate();

      if (BuildConfig.DEBUG) {      
          StethoWrapper.initialize(this);
          StethoWrapper.addInterceptor();
      }

      SoLoader.init(this, /* native exopackage */ false);
    }
```

4. Open the project in Android Studio and resolve any dependency issues. The IDE should guide you through this steps after hovering your pointer over the red lines.

5. Run `react-native run-android`.

6. In a new Chrome tab, open: `chrome://inspect`, then click on the 'Inspect device' item next to "Powered by Stetho".

## Debugging native code

When working with native code (e.g. when writing native modules) you can launch the app from Android Studio or Xcode and take advantage of the debugging features (setup breakpoints, etc.) as you would in case of building a standard native app.
