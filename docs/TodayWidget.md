---
id: app-extensions
title: App Extensions
layout: docs
category: Guides (iOS)
permalink: docs/app-extensions.html
next: native-modules-android
previous: building-for-apple-tv
---

An app extension lets you extend custom functionality and content beyond your app and make it available to users while they’re interacting with other apps or the system.

You create an app extension to enable a specific task. For example, to let users post to your social service from a web browser, you can provide a Share extension. Or, to let users catch up on their favorite team, you can provide a Today widget that displays current sports scores in Notification Center. You can even create an app extension that provides a custom keyboard that users can use in place of the iOS system keyboard. (Source: Apple)

## Today Widget

The memory limit of a Today widget is 16 MB. Unfortunately, Today widget implementations using React Native work unreliably because the memory usage tends to be too high. Running builds in the simulator works for development purposes, but running builds in the memory-limited environment of a device's notification view may not always work. The memory usage is too high, yielding the message 'Unable to Load' in the Today widget's view.

![](img/TodayWidgetUnableToLoad.jpg)

Running debug configured builds on a device usually exceeds memory limits. Running release configured builds may succeed and render viable views. However, these builds are unreliable; the memory usage may be too close to the 16 MB limit. Common operations, like fetching data from an API, may end up taking too much memory.

To experiment with the limits of React Native Today widget implementations, try extending the example project in [react-native-today-widget](https://github.com/matejkriz/react-native-today-widget/).

## Other App Extensions

Other types of app extensions have bigger memory limits than the Today widget. For instance, Custom Keyboard extensions are limited to 48 MB and Share extensions are limited to 120 MB. Implementing such app extensions with React Native is more viable. One proof of concept example is [react-native-ios-share-extension](https://github.com/andrewsardone/react-native-ios-share-extension).

-------------------------------------------------------------------------------

## Learn more

See Apple's [App Extension Essentials](https://developer.apple.com/library/content/documentation/General/Conceptual/ExtensibilityPG/index.html#//apple_ref/doc/uid/TP40014214-CH20-SW1) and Conrad Kramer's [Memory Use in Extensions](https://cocoaheads.tv/memory-use-in-extensions-by-conrad-kramer/) for more information.
