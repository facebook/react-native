---
id: running-on-device-ios
title: Running On Device
layout: docs
category: Guides (iOS)
permalink: docs/running-on-device-ios.html
next: embedded-app-ios
---

Note that running on device requires [Apple Developer account](https://developer.apple.com/register) and provisioning your iPhone. This guide covers only React Native specific topic.

## Accessing development server from device

You can iterate quickly on device using development server. To do that, your laptop and your phone have to be on the same wifi network.

1. Open `AwesomeApp/ios/AwesomeApp/AppDelegate.m`
2. Change the IP in the URL from `localhost` to your laptop's IP. On Mac, you can find the IP address in System Preferences / Network.
3. In Xcode select your phone as build target and press "Build and run"

> Hint
>
> Shake the device to open development menu (reload, debug, etc.)

## Using offline bundle

You can also pack all the JavaScript code within the app itself. This way you can test it without development server running and submit the app to the AppStore.

1. Open `AwesomeApp/ios/AwesomeApp/AppDelegate.m`
2. Follow the instructions for "OPTION 2":
  * Uncomment `jsCodeLocation = [[NSBundle mainBundle] ...`
  * Run the `react-native bundle` command in terminal from the root directory of your app

The bundle script supports a couple of flags:

* `--dev` - sets the value of `__DEV__` variable to true. When `true` it turns on a bunch of useful development warnings. For production it is recommended to set `__DEV__=false`.
* `--minify` - pipe the JS code through UglifyJS.

Note that on 0.14 we'll change the API of `react-native bundle`. The major changes are: 

* API is now `entry-file <path>` based instead of url based.
* Need to specify which platform you're bundling for `--platform <ios|android>`.
* Option `--out` has been renamed for `--bundle-output`.
* Source maps are no longer automatically generated. Need to specify `--sourcemap-output <path>` 

## Disabling in-app developer menu

When building your app for production, your app's scheme should be set to `Release` as detailed in [the debugging documentation](/react-native/docs/debugging.html#debugging-react-native-apps) in order to disable the in-app developer menu.

## Troubleshooting

If `curl` command fails make sure the packager is running. Also try adding `--ipv4` flag to the end of it.

If you started your project a while ago, `main.jsbundle` might not be included into Xcode project. To add it, right click on your project directory and click "Add Files to ..." - choose the `main.jsbundle` file that you generated.
