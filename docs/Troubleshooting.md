---
id: troubleshooting
title: Troubleshooting
layout: docs
category: Quick Start
permalink: docs/troubleshooting.html
---

## Cmd-R does not reload the simulator
Enable iOS simulator's "Connect hardware keyboard" from menu Hardware > Keyboard menu.

![Keyboard Menu](https://cloud.githubusercontent.com/assets/1388454/6863127/03837824-d409-11e4-9251-e05bd31d978f.png)


If you are using a non-QWERTY/AZERTY keyboard layout you can use the `Hardware > Shake Gesture` to bring up the dev menu and click "Refresh". Alternatively, you can hit `Cmd-P` on Dvorak/Colemak layouts to reload the simulator.

## Port already in use red-screen
![red-screen](https://cloud.githubusercontent.com/assets/602176/6857442/63fd4f0a-d3cc-11e4-871f-875b0c784611.png)


Something is probably already running on port 8081. You can either kill it or try to change which port the packager is listening to.

##### Kill process on port 8081
`$ sudo lsof -n -i4TCP:8081 | grep LISTEN`

then

`$ kill -9 <cma process id>`



##### Change the port in Xcode
Edit `AppDelegate.m` to use a different port.
```
  // OPTION 1
  // Load from development server. Start the server from the repository root:
  //
  // $ npm start
  //
  // To run on device, change `localhost` to the IP address of your computer, and make sure your computer and
  // iOS device are on the same Wi-Fi network.
  jsCodeLocation = [NSURL URLWithString:@"http://localhost:9381/index.ios.bundle"];
  ```


## Watchman took too long to load
Permission settings prevent Watchman from loading. A recent update solves this, get a HEAD install of Watchman if you are experiencing this error.

```
brew uninstall watchman
brew install --HEAD watchman
```

## NPM locking error

If in the `react-native init <project>` phase you saw npm fail with "npm WARN locking Error: EACCES" then try the following:
```
sudo chown -R $USER ~/.npm
sudo chown -R $USER /usr/local/lib/node_modules
```

## Debugging in Chrome hangs and/or does not work well
It is possible that one of your Chrome extensions is interacting in unexpected ways with the debugger. If you are having this issue, try disabling all of your extensions and re-enabling them one-by-one until you find the problematic extension.

## Xcode Build Failures

To see the exact error that is causing your build to fail, go into the Issues Navigator in the left sidebar.

##### React libraries missing
If you are using CocoaPods, verify that you have added React along with the subspecs to the `Podfile`. For example, if you were using the `<Text />`, `<Image />` and `fetch()` APIs, you would need to add these in your `Podfile`:
```
pod 'React', :path => '../node_modules/react-native', :subspecs => [
  'RCTText',
  'RCTImage',
  'RCTNetwork',
  'RCTWebSocket',
]
```
Next, make sure you have run `pod install` and that a `Pods/` directory has been created in your project with React installed. CocoaPods will instruct you to use the generated `.xcworkspace` file henceforth to be able to use these installed dependencies.

If you are adding React manually, make sure you have included all the relevant dependencies, like `RCTText.xcodeproj`, `RCTImage.xcodeproj` depending on the ones you are using. Next, the binaries built by these dependencies have to be linked to your app binary. Use the `Linked Frameworks and Binaries` section in the Xcode project settings. More detailed steps are here: [Linking Libraries](docs/linking-libraries-ios.html#content).

##### Argument list too long: recursive header expansion failed

In the project's build settings, `User Search Header Paths` and `Header Search Paths` are two configs that specify where Xcode should look for `#import` header files specified in the code. For Pods, CocoaPods uses a default array of specific folders to look in. Verify that this particular config is not overwritten, and that none of the folders configured are too large. If one of the folders is a large folder, Xcode will attempt to recursively search the entire directory and throw above error at some point.

To revert the `User Search Header Paths` and `Header Search Paths` build settings to their defaults set by CocoaPods - select the entry in the Build Settings panel, and hit delete. It will remove the custom override and return to the CocoaPod defaults.

## Unable to connect to development server

##### iOS
Ensure that you are on the same WiFi network as your computer. If you're using a cell data plan, your phone can't access your computer's local IP address.

##### Android
You need to run `adb reverse tcp:8081 tcp:8081` to forward requests from the device to your computer. This works only on Android 5.0 and newer.

## Module that uses `WebSocket` (such as Firebase) throws an exception

React Native implements a polyfill for WebSockets. These polyfills are initialized as part of the react-native module that you include in your application through `import React from 'react-native'`. If you load another module that requires WebSockets, be sure to load/require it after react-native.

So:
```
import React from 'react-native';
import Firebase from 'firebase';
```

Requiring firebase *before* react-native will result in a 'No transports available' redbox.

Discovered thanks to issue [#3645](https://github.com/facebook/react-native/issues/3645). If you're curious, the polyfills are set up in [InitializeJavaScriptAppEngine.js](https://github.com/facebook/react-native/blob/master/Libraries/JavaScriptAppEngine/Initialization/InitializeJavaScriptAppEngine.js).
