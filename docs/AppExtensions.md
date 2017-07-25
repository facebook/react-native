---
id: app-extensions
title: App Extensions
layout: docs
category: Guides (iOS)
permalink: docs/app-extensions.html
next: native-modules-android
previous: building-for-apple-tv
---

Building app extensions with React Native is currently not supported because of memory issues.

## Today Widget

Today widget implementations using React Native work unreliably. Running builds in the simulator works for development purposes, but running builds in the memory-limited environment of a device's notification view may not always work. The memory usage is too high, yielding the message 'Unable to Load' in the today widget's view.

![](img/TodayWidgetUnableToLoad.jpg)

Running debug configured builds on a device usually exceeds memory limits. Running release configured builds may succeed and render viable views. However, these builds are unreliable; the memory usage may be too close to device's limits. Operations like fetching data from an API may take up too much memory. The exact memory limits are not definitively known, but the range is somewhere between 10 and 20 MB.

To experiment with the limits of React Native today widget implementation, try extending the example project in [react-native-today-widget](https://github.com/matejkriz/react-native-today-widget/).

-------------------------------------------------------------------------------

## Learn more

See [App Extension Essentials: Creating an App Extension](https://developer.apple.com/library/content/documentation/General/Conceptual/ExtensibilityPG/ExtensionCreation.html#//apple_ref/doc/uid/TP40014214-CH5-SW1) for more information.
