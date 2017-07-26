---
id: today-widget
title: Today Widget
layout: docs
category: Guides (iOS)
permalink: docs/today-widget.html
next: native-modules-android
previous: building-for-apple-tv
---

The memory limit for a today widget is 16 MB. Unfortunately, today widget implementations using React Native work unreliably because the memory usage tends to be too high. Running builds in the simulator works for development purposes, but running builds in the memory-limited environment of a device's notification view may not always work. The memory usage is too high, yielding the message 'Unable to Load' in the today widget's view.

![](img/TodayWidgetUnableToLoad.jpg)

Running debug configured builds on a device usually exceeds memory limits. Running release configured builds may succeed and render viable views. However, these builds are unreliable; the memory usage may be too close to the 16 MB limit. Common operations, like fetching data from an API, may end up taking too much memory.

To experiment with the limits of React Native today widget implementation, try extending the example project in [react-native-today-widget](https://github.com/matejkriz/react-native-today-widget/).

## Other App Extensions

Other kinds of app extensions have bigger memory limits than today widgets. For instance, keyboard extensions are limited to 48 MB and share extensions are limited to 120 MB. Implementing such app extensions with React Native is more viable. One proof of concept example is [react-native-ios-share-extension](https://github.com/andrewsardone/react-native-ios-share-extension).

-------------------------------------------------------------------------------

## Learn more

See [App Extension Essentials: Creating an App Extension](https://developer.apple.com/library/content/documentation/General/Conceptual/ExtensibilityPG/ExtensionCreation.html#//apple_ref/doc/uid/TP40014214-CH5-SW1) and Conrad Kramer's [Memory Use in Extensions](https://cocoaheads.tv/memory-use-in-extensions-by-conrad-kramer/) for more information.
