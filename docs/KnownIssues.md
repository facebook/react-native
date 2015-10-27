---
id: known-issues
title: Known Issues
layout: docs
category: Guides
permalink: docs/known-issues.html
next: performance
---

### Missing Modules and Native Views

This is an initial release of React Native Android and therefore not all of the views present on iOS are released on Android. We are very much interested in the communities' feedback on the next set of modules and views for Open Source. Not all native views between iOS and Android have a 100% equivalent representation, here it will be necessary to use a counterpart eg using ProgressBar on Android in place of ActivityIndicator on iOS.

Our provisional plan for common views and modules includes:

#### Views

```
Swipe Refresh
Spinner
ART
Maps
Modal
Webview
```

#### Modules

```
Geo Location
Net Info
Camera Roll
App State
Dialog
Intent
Media
Pasteboard
PushNotificationIOS
Alert
```

### Some props are only supported on one platform

There are properties that work on one platform only, either because they can inherently only be supported on that platform or because they haven't been implemented on the other platforms yet. All of these are annotated with `@platform` in JS docs and have a small badge next to them on the website. See e.g. [Image](https://facebook.github.io/react-native/docs/image.html).

### Platform parity

There are known cases where the APIs could be made more consistent across iOS and Android:

- `<SwitchAndroid>` and `<SwitchIOS>` are very similar and should be unified to a single `<Switch>` component.
- `<AndroidViewPager>` (to be open sourced soon) and `<ScrollView pagingEnabled={true}>` on iOS do a similar thing. We might want to unify them to `<ViewPager>`.
- `alert()` needs Android support (once the Dialogs module is open sourced)
- It might be possible to bring `LinkingIOS` and `IntentAndroid` (to be open sourced) closer together.
- `ActivityIndicator` could render a native spinning indicator on both platforms (currently this is done using `ActivityIndicatorIOS` on iOS and `ProgressBarAndroid` on Android).
- `ProgressBar` could render a horizontal progress bar on both platforms (currently only supported on iOS via `ProgressViewIOS`).

### Publishing modules on Android

There is currently no easy way of publishing custom native modules on Android. Smooth work flow for contributors is important and this will be looked at very closely after the initial Open Source release. Of course the aim will be to streamline and optimize the process between iOS and Android as much as possible.

### Overlay view with opacity of 0 cannot be clicked through

There is a noted difference in the handling of Views with an opacity of 0 between iOS and Android. While iOS will allow these views to be clicked through and the View below will receive the touch input, for Android the touch will be blocked. This can be demonstrated in this example where it will only be possible to click the touchable on iOS.

```
<View style={{flex: 1}}>
  <TouchableOpacity onPress={() => alert('hi!')}>
    <Text>HELLO!</Text>
  </TouchableOpacity>

  <View style={{
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    opacity: 0}} />
</View>
```

The behavior on Android is what you would expect from the web as well.  If you want to be able to click through an overlaying transparent view, you can set `pointerEvents='none'` on it.

### The `overflow` style property defaults to `hidden` and cannot be changed on Android

This is a result of how Android rendering works. This feature is not being worked on as it would be a significant undertaking and there are many more important tasks.

### No support for shadows on Android

We don't support shadows on Android currently. These are notoriously hard to implement as they require drawing outside of a view's bounds and Android's invalidation logic has a hard time with that. A possible solution is to use [elevation](https://developer.android.com/training/material/shadows-clipping.html), but more experimentation will be required.

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

The text input has by default a border at the bottom of its view. This border has its padding set by the background image provided by the system, and it cannot be changed. Solutions to avoid this is to either not set height explicitly, case in which the system will take care of displaying the border in the correct position, or to not display the border by setting underlineColor to transparent.
