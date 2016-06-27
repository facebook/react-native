---
id: running-on-device-ios
title: Running On Device
layout: docs
category: Guides (iOS)
permalink: docs/running-on-device-ios.html
next: running-on-simulator-ios
---

Running an iOS app on a device requires an [Apple Developer account](https://developer.apple.com/) and provisioning your iPhone. This guide covers only React Native specific topics.

## Accessing the development server from device

You can iterate quickly on device using the development server. First, ensure that you are on the same Wi-Fi network as your computer.

1. Open `ios/YourApp/AppDelegate.m`
2. Change the host in the URL from `localhost` to your laptop's IP address. On Mac, you can find the IP address in System Preferences / Network.
3. In Xcode, select your phone as build target and press "Build and run"

> Hint
>
> Shake the device to open the [developer menu](/docs/debugging.html#accessing-the-in-app-developer-menu).

## Building your app for production

You have built a great app using React Native, and you are now itching to release it in the App Store. The process is the same as any other native iOS app, with some additional considerations to take into account.

### Disabling the developer menu

Building an app for distribution in the App Store requires using the `Release` scheme in Xcode. Apps built for `Release` will automatically disable the in-app developer menu. This will prevent your users from inadvertently accessing the menu in production.

### Using the offline bundle

Set up your app to load your JavaScript, images, and other static assets from its resource bundle rather than the development server. This way you can test the app independently of the development server, and will allow you to distribute the app to beta testers and submit the app to the App Store.

1. Open `ios/YourApp/AppDelegate.m`
2. Uncomment the line, `jsCodeLocation = [[NSBundle mainBundle] ...`

### App Transport Security

App Transport Security is a security feature, added in iOS 9, that rejects all HTTP requests that are not sent over HTTPS. This can result in HTTP traffic being blocked, including the developer React Native server.

ATS is disabled by default in projects generated using the React Native CLI in order to make development easier. You should re-enable ATS prior to building your app for production by removing the `NSAllowsArbitraryLoads` entry from your `Info.plist` file in the `ios/` folder.

To learn more about how to configure ATS on your own Xcode projects, see [this post on ATS][cats].

[cats]: http://ste.vn/2015/06/10/configuring-app-transport-security-ios-9-osx-10-11/
