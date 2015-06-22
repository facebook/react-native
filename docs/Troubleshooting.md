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


If you are using a non-QWERTY/AZERTY keyboard layout you can use the `Hardware > Shake Gesture` to bring up the dev menu and click "Refresh"

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

To see the exact error what is causing your build to fail, go into the Issues Navigator in the left sidebar.

##### React libraries missing
If you are using CocoaPods, verify that you have added React along with the subspecs to the `Podfile`. For example, if you were using the `<Text />`, `<Image />` and `fetch()` APIs, you would need to add these in your `Podfile`:
```
pod 'React'
pod 'React/RCTText'
pod 'React/RCTImage'
pod 'React/RCTNetwork'
```
Next, make sure you have run `pod install` and that a `Pods/` directory has been created in your project with React installed. CocoaPods will instruct you to use the generated `.xcworkspace` file henceforth to be able to use these installed dependencies.

If you are adding React manually, make sure you have included all the relevant dependancies, like `RCTText.xcodeproj`, `RCTImage.xcodeproj` depending on the ones you are using. Next, the binaries built by these dependencies have to be linked to your app binary. Use the `Linked Frameworks and Binaries` section in the Xcode project settings. More detailed steps are here: [Linking Libraries](https://facebook.github.io/react-native/docs/linking-libraries.html#content).

##### Argument list too long: recursive header expansion failed

This error occurs when Xcode ends up recursing very deeply into a folder that has been configured for it to search for `#import` files. In your project and target build settings, search for 'Header Search Paths' and 'User Search Header Paths' and make sure that you are not making Xcode recurse over a very large set of files and folders recursively. You might have overwritten the default config by CocoaPods added there - simply select and hit delete to go back to the CocoaPods default.
