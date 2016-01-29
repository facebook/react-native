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

When you run your app on device, we pack all the JavaScript code and the images used into the app's resources. This way you can test it without development server running and submit the app to the AppStore.

1. Open `AwesomeApp/ios/AwesomeApp/AppDelegate.m`
2. Uncomment `jsCodeLocation = [[NSBundle mainBundle] ...`
3. The JS bundle will be built for dev or prod depending on your app's scheme (Debug = development build with warnings, Release = minified prod build with perf optimizations). To change the scheme navigate to `Product > Scheme > Edit Scheme...` in xcode and change `Build Configuration` between `Debug` and `Release`.

## Disabling in-app developer menu

When building your app for production, your app's scheme should be set to `Release` as detailed in [the debugging documentation](/react-native/docs/debugging.html#debugging-react-native-apps) in order to disable the in-app developer menu.

## Troubleshooting

If `curl` command fails make sure the packager is running. Also try adding `--ipv4` flag to the end of it.

Note that since [v0.14](https://github.com/facebook/react-native/releases/tag/0.14.0) JS and images are automatically packaged into the iOS app using `Bundle React Native code and images` Xcode build phase.
