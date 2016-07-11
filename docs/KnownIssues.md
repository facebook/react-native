---
id: known-issues
title: Known Issues
layout: docs
category: Guides
permalink: docs/known-issues.html
next: performance
---

### Devtools "React" Tab Does Not Work

It's [currently not possible](https://github.com/facebook/react-devtools/issues/229) to use the "React" tab in the devtools to inspect app widgets. This is due to a change in how the application scripts are evaluated in the devtools plugin; they are now run inside a Web Worker, and the plugin is unaware of this and so unable to communicate properly with React Native.

However, you can still use the Console feature of the devtools, and debugging JavaScript with breakpoints works too. To use the console, make sure to select the `⚙debuggerWorker.js` entry in the devtools dropdown that by default is set to `<top frame>`.

### Missing Android Modules and Views

The work on React Native for Android started later than React Native for iOS. Most views and modules are now available on Android, with the following exceptions:

#### Views

- Maps - Please use Leland Richardson's [react-native-maps](https://github.com/lelandrichardson/react-native-maps) as it is more feature-complete than our internal implementation.

#### Modules

- Android Push Notifications - Please use a [3rd party module](https://js.coach/react-native?filters=android&search=gcm).

### Some props are only supported on one platform

There are properties that work on one platform only, either because they can inherently only be supported on that platform or because they haven't been implemented on the other platforms yet. All of these are annotated with `@platform` in JS docs and have a small badge next to them on the website. See e.g. [Image](docs/image.html).

### Platform parity

There are known cases where the APIs could be made more consistent across iOS and Android:

- `<ViewPagerAndroid>` and `<ScrollView pagingEnabled={true}>` on iOS do a similar thing. We might want to unify them to `<ViewPager>`.
- `ProgressBar` could render a horizontal progress bar on both platforms (on iOS this is `ProgressViewIOS`, on Android it's `ProgressBarAndroid`).

### The `overflow` style property defaults to `hidden` and cannot be changed on Android

This is a result of how Android rendering works. This feature is not being worked on as it would be a significant undertaking and there are many more important tasks.

Another issue with `overflow: 'hidden'` on Android: a view is not clipped by the parent's `borderRadius` even if the parent has `overflow: 'hidden'` enabled – the corners of the inner view will be visible outside of the rounded corners. This is only on Android; it works as expected on iOS. See a [demo of the bug](https://rnplay.org/apps/BlGjdQ) and the [corresponding issue](https://github.com/facebook/react-native/issues/3198).

### View shadows

The `shadow*` [view styles](docs/view.html#style) apply on iOS, and the `elevation` view prop is available on Android. Setting `elevation` on Android is equivalent to using the [native elevation API](https://developer.android.com/training/material/shadows-clipping.html#Elevation), and has the same limitations (most significantly, it only works on Android 5.0+). Setting `elevation` on Android also affects the z-order for overlapping views.

### Android M permissions

The open source version of React Native doesn't yet support the [Android M permission model](http://developer.android.com/training/permissions/requesting.html).

### Layout-only nodes on Android

An optimization feature of the Android version of React Native is for views which only contribute to the layout to not have a native view, only their layout properties are propagated to their children views. This optimization is to provide stability in deep view hierarchies for React Native and is therefore enabled by default. Should you depend on a view being present or internal tests incorrectly detect a view is layout only it will be necessary to turn off this behavior. To do this, set `collapsable` to false as in this example:
```
<View collapsable={false}>
    ...
</View>
```

### Memory issues with PNG images

React Native Android depends on [Fresco](https://github.com/facebook/fresco) for loading and displaying images. Currently we have disabled downsampling because it is experimental, so you may run into memory issues when loading large PNG images.

### react-native init hangs

Try running `react-native init` with `--verbose` and see [#2797](https://github.com/facebook/react-native/issues/2797) for common causes.

### Text Input Border

The text input has by default a border at the bottom of its view. This border has its padding set by the background image provided by the system, and it cannot be changed. Solutions to avoid this is to either not set height explicitly, case in which the system will take care of displaying the border in the correct position, or to not display the border by setting underlineColorAndroid to transparent.

### iOS App Transport Security and loading HTTP resources

As of iOS 9, new Xcode projects enable App Transport Security by default, which rejects all HTTP requests that are not sent over HTTPS. This can result in HTTP traffic being blocked (including the developer React Native server) with the following console errors:

```
App Transport Security has blocked a cleartext HTTP (http://) resource load since it is insecure. Temporary exceptions can be configured via your app's Info.plist file.
```

```
NSURLSession/NSURLConnection HTTP load failed (kCFStreamErrorDomainSSL, -9802)
```

See our guide for [running on an iOS device](RunningOnDeviceIOS.md) and working around the ATS issues, or [several](http://useyourloaf.com/blog/app-transport-security/) [community](https://www.hackingwithswift.com/example-code/system/how-to-handle-the-https-requirements-in-ios-9-with-app-transport-security) [posts](https://ste.vn/2015/06/10/configuring-app-transport-security-ios-9-osx-10-11/) on handling common cases like [whitelisting specific domains](http://stackoverflow.com/a/30732693) for non-HTTPS traffic.
