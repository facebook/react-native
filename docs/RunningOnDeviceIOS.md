---
id: running-on-device-ios
title: Running On Device
layout: docs
category: Guides (iOS)
permalink: docs/running-on-device-ios.html
next: communication-ios
---

Note that running on device requires [Apple Developer account](https://developer.apple.com/register) and provisioning your iPhone. This guide covers only React Native specific topic.

## Accessing development server from device

You can iterate quickly on device using development server. Ensure that you are on the same WiFi network as your computer.

1. Open `AwesomeApp/ios/AwesomeApp/AppDelegate.m`
2. Change the IP in the URL from `localhost` to your laptop's IP. On Mac, you can find the IP address in System Preferences / Network.
3. Temporarily disable App Transport Security (ATS) by [adding the `NSAllowsArbitraryLoads` entry to your `Info.plist` file][gpl]. Since ATS does not allow insecure HTTP requests to IP addresses, you must completely disable it to run on a device. This is only a requirement for development on a device, and unless you can't workaround an issue you should leave ATS enabled for production builds. For more information, see [this post on configuring ATS][bats].
4. In Xcode select your phone as build target and press "Build and run"

[gpl]: https://gist.github.com/andrewsardone/91797ff9923b9ac6ea64
[bats]: http://ste.vn/2015/06/10/configuring-app-transport-security-ios-9-osx-10-11/

> Hint
>
> Shake the device to open development menu (reload, debug, etc.)

## Using offline bundle

When you run your app on device, we pack all the JavaScript code and the images used into the app's resources. This way you can test it without development server running and submit the app to the AppStore.

1. Open `AwesomeApp/ios/AwesomeApp/AppDelegate.m`
2. Uncomment `jsCodeLocation = [[NSBundle mainBundle] ...`
3. The JS bundle will be built for dev or prod depending on your app's scheme (Debug = development build with warnings, Release = minified prod build with perf optimizations). To change the scheme navigate to `Product > Scheme > Edit Scheme...` in xcode and change `Build Configuration` between `Debug` and `Release`.

## Disabling in-app developer menu

When building your app for production, your app's scheme should be set to `Release` as detailed in [the debugging documentation](docs/debugging.html#debugging-react-native-apps) in order to disable the in-app developer menu.

## Troubleshooting

If `curl` command fails make sure the packager is running. Also try adding `--ipv4` flag to the end of it.

Note that since [v0.14](https://github.com/facebook/react-native/releases/tag/0.14.0) JS and images are automatically packaged into the iOS app using `Bundle React Native code and images` Xcode build phase.
