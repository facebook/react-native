---
id: app-extensions
title: App Extensions
layout: docs
category: Guides (iOS)
permalink: docs/app-extensions.html
next: native-modules-android
previous: building-for-apple-tv
---

App extensions let you provide custom functionality and content outside of your main app. There are different types of app extensions on iOS, and they are all covered in the [App Extension Programming Guide](https://developer.apple.com/library/content/documentation/General/Conceptual/ExtensibilityPG/index.html#//apple_ref/doc/uid/TP40014214-CH20-SW1). In this guide, we'll briefly cover how you may take advantage of app extensions on iOS.

## Memory use in extensions

As these extensions are loaded outside of the regular app sandbox, it's highly likely that several of these app extensions will be loaded simultaneously. As you might expect, these extensions have small memory usage limits. Keep these in mind when developing your app extensions. It's always highly recommended to test your application on an actual device, and more so when developing app extensions: too frequently, developers find that their extension works just fine in the iOS Simulator, only to get user reports that their extension is not loading on actual devices.

We highly recommend that you watch Conrad Kramer's talk on [Memory Use in Extensions](https://cocoaheads.tv/memory-use-in-extensions-by-conrad-kramer/) to learn more about this topic.

### Today widget

The memory limit of a Today widget is 16 MB. As it happens, Today widget implementations using React Native may work unreliably because the memory usage tends to be too high. You can tell if your Today widget is exceeding the memory limit if it yields the message 'Unable to Load':

![](img/TodayWidgetUnableToLoad.jpg)

Always make sure to test your app extensions in a real device, but be aware that this may not be sufficient, especially when dealing with Today widgets. Debug-configured builds are more likely to exceed the memory limits, while release-configured builds don't fail right away. We highly recommend that you use [Xcode's Instruments](https://developer.apple.com/library/content/documentation/DeveloperTools/Conceptual/InstrumentsUserGuide/index.html) to analyze your real world memory usage, as it's very likely that your release-configured build is very close to the 16 MB limit. In situations like these, it is easy to go over the 16 MB limit by performing common operations, such as fetching data from an API.

To experiment with the limits of React Native Today widget implementations, try extending the example project in [react-native-today-widget](https://github.com/matejkriz/react-native-today-widget/).

### Other app extensions

Other types of app extensions have greater memory limits than the Today widget. For instance, Custom Keyboard extensions are limited to 48 MB, and Share extensions are limited to 120 MB. Implementing such app extensions with React Native is more viable. One proof of concept example is [react-native-ios-share-extension](https://github.com/andrewsardone/react-native-ios-share-extension).
