---
title: Right-to-Left Layout Support For React Native Apps
author: Mengjue (Mandy) Wang
authorTitle: Software Engineer Intern at Facebook
authorURL: https://github.com/MengjueW
authorImage: https://avatars0.githubusercontent.com/u/13987140?v=3&s=128
category: engineering
---
After launching an app to the app stores, internationalization is the next step to further your audience reach. Over 20 countries and numerous people around the world use Right-to-Left (RTL) languages. Thus, making your app support RTL for them is necessary.

We're glad to announce that React Native has been improved to support RTL layouts. This is now available in the [react-native](https://github.com/facebook/react-native) master branch today, and will be available in the next RC: [`v0.33.0-rc`](https://github.com/facebook/react-native/releases).

This involved changing [css-layout](https://github.com/facebook/css-layout), the core layout engine used by RN, and RN core implementation, as well as specific OSS JS components to support RTL.

To battle test the RTL support in production, the latest version of the **Facebook Ads Manager** app (the first cross-platform 100% RN app) is now available in Arabic and Hebrew with RTL layouts for both [iOS](https://itunes.apple.com/app/id964397083) and [Android](https://play.google.com/store/apps/details?id=com.facebook.adsmanager). Here is how it looks like in those RTL languages:

<p align="center">
  <img src="/react-native/blog/img/rtl-ama-ios-arabic.png" width="280" style="margin:10px">
  <img src="/react-native/blog/img/rtl-ama-android-hebrew.png" width="280" style="margin:10px">
</p>

## Overview Changes in RN for RTL support
[css-layout](https://github.com/facebook/css-layout) already has a concept of `start` and `end` for the layout. In the Left-to-Right (LTR) layout, `start` means `left`, and `end` means `right`. But in RTL, `start` means `right`, and `end` means `left`. This means we can make RN depend on the `start` and `end` calculation to compute the correct layout, which includes `position`, `padding`, and `margin`.

In addition, [css-layout](https://github.com/facebook/css-layout) already makes each component's direction inherits from its parent. This means, we simply need to set the direction of the root component to RTL, and the entire app will flip.

The diagram below describes the changes at high level:

![](/react-native/blog/img/rtl-rn-core-updates.png)

These include:

* [css-layout RTL support for absolute positioning](https://github.com/facebook/css-layout/commit/46c842c71a1232c3c78c4215275d104a389a9a0f)
* mapping `left` and `right` to `start` and `end` in RN core implementation for shadow nodes
* and exposing a [bridged utility module](https://github.com/facebook/react-native/blob/f0fb228ec76ed49e6ed6d786d888e8113b8959a2/Libraries/Utilities/I18nManager.js) to help control the RTL layout

With this update, when you allow RTL layout for your app:

* every component layout will flip horizontally
* some gestures and animations will automatically have RTL layout, if you are using RTL-ready OSS components
* minimal additional effort may be needed to make your app fully RTL-ready

## Making an App RTL-ready

1. To support RTL, you should first add the RTL language bundles to your app.
   * See the general guides from [iOS](https://developer.apple.com/library/ios/documentation/MacOSX/Conceptual/BPInternational/LocalizingYourApp/LocalizingYourApp.html#//apple_ref/doc/uid/10000171i-CH5-SW1) and [Android](https://developer.android.com/training/basics/supporting-devices/languages.html).

2. Allow RTL layout for your app by calling the `allowRTL()` function at the beginning of native code. We provided this utility to only apply to an RTL layout when your app is ready. Here is an example:

   iOS:
    ```objc
    // in AppDelegate.m
  	[[RCTI18nUtil sharedInstance] allowRTL:YES];
    ```

   Android:
    ```java
    // in MainActivity.java
  	I18nUtil sharedI18nUtilInstance = I18nUtil.getInstance();
  	sharedI18nUtilInstance.setAllowRTL(context, true);
    ```

3. For Android, you need add `android:supportsRtl="true"` to the [`<application>`](http://developer.android.com/guide/topics/manifest/application-element.html) element in `AndroidManifest.xml` file.

Now, when you recompile your app and change the device language to an RTL language (e.g. Arabic or Hebrew), your app layout should change to RTL automatically.

## Writing RTL-ready Components

In general, most components are already RTL-ready, for example:

* Left-to-Right Layout

  <p align="left">
    <img src="/react-native/blog/img/rtl-demo-listitem-ltr.png" width="300">
  </p>

* Right-to-Left Layout

  <p align="left">
    <img src="/react-native/blog/img/rtl-demo-listitem-rtl.png" width="300">
  </p>

However, there are several cases to be aware of, for which you will need the [`I18nManager`](https://github.com/facebook/react-native/blob/f0fb228ec76ed49e6ed6d786d888e8113b8959a2/Libraries/Utilities/I18nManager.js). In [`I18nManager`](https://github.com/facebook/react-native/blob/f0fb228ec76ed49e6ed6d786d888e8113b8959a2/Libraries/Utilities/I18nManager.js), there is a constant `isRTL` to tell if layout of app is RTL or not, so that you can make the necessary changes according to the layout.

#### Icons with Directional Meaning
If your component has icons or images, they will be displayed the same way in LTR and RTL layout, because RN will not flip your source image. Therefore, you should flip them according to the layout style.

* Left-to-Right Layout

  <p align="left">
    <img src="/react-native/blog/img/rtl-demo-icon-ltr.png" width="300">
  </p>

* Right-to-Left Layout

  <p align="left">
    <img src="/react-native/blog/img/rtl-demo-icon-rtl.png" width="300">
  </p>

Here are two ways to flip the icon according to the direction:

* Adding a `transform` style to the image component:
  ```js
  <Image
    source={...}
    style={{transform: [{scaleX: I18nManager.isRTL ? -1 : 1}]}}
  />
  ```

* Or, changing the image source according to the direction:
  ```js
  let imageSource = require('./back.png');
  if (I18nManager.isRTL) {
  	imageSource = require('./forward.png');
  }
  return (
    <Image source={imageSource} />
  );
  ```

#### Gestures and Animations

In iOS and Android development, when you change to RTL layout, the gestures and animations are the opposite of LTR layout. Currently, in RN, gestures and animations are not supported on RN core code level, but on components level. The good news is, some of these components already support RTL today, such as [`SwipeableRow`](https://github.com/facebook/react-native/blob/38a6eec0db85a5204e85a9a92b4dee2db9641671/Libraries/Experimental/SwipeableRow/SwipeableRow.js) and [`NavigationExperimental`](https://github.com/facebook/react-native/tree/master/Libraries/NavigationExperimental). However, other components with gestures will need to support RTL manually.

A good example to illustrate gesture RTL support is [`SwipeableRow`](https://github.com/facebook/react-native/blob/38a6eec0db85a5204e85a9a92b4dee2db9641671/Libraries/Experimental/SwipeableRow/SwipeableRow.js).

<p align="center">
  <img src="/react-native/blog/img/rtl-demo-swipe-ltr.png" width="280" style="margin:10px">
  <img src="/react-native/blog/img/rtl-demo-swipe-rtl.png" width="280" style="margin:10px">
</p>


##### Gestures Example
```js
// SwipeableRow.js
_isSwipingExcessivelyRightFromClosedPosition(gestureState: Object): boolean {
  // ...
  const gestureStateDx = IS_RTL ? -gestureState.dx : gestureState.dx;
  return (
    this._isSwipingRightFromClosed(gestureState) &&
    gestureStateDx > RIGHT_SWIPE_THRESHOLD
  );
},
```

##### Animation Example
```js
// SwipeableRow.js
_animateBounceBack(duration: number): void {
  // ...
  const swipeBounceBackDistance = IS_RTL ?
    -RIGHT_SWIPE_BOUNCE_BACK_DISTANCE :
    RIGHT_SWIPE_BOUNCE_BACK_DISTANCE;
  this._animateTo(
    -swipeBounceBackDistance,
    duration,
    this._animateToClosedPositionDuringBounce,
  );
},
```


## Maintaining Your RTL-ready App

Even after the initial RTL-compatible app release, you will likely need to iterate on new features. To improve development efficiency, [`I18nManager`](https://github.com/facebook/react-native/blob/f0fb228ec76ed49e6ed6d786d888e8113b8959a2/Libraries/Utilities/I18nManager.js) provides the `forceRTL()` function for faster RTL testing without changing the test device language. You might want to provide a simple switch for this in your app. Here's an example from the RTL example in the RNTester:

<p align="center">
  <img src="/react-native/blog/img/rtl-demo-forcertl.png" width="300">
</p>

```js
<RNTesterBlock title={'Quickly Test RTL Layout'}>
  <View style={styles.flexDirectionRow}>
    <Text style={styles.switchRowTextView}>
      forceRTL
    </Text>
    <View style={styles.switchRowSwitchView}>
      <Switch
        onValueChange={this._onDirectionChange}
        style={styles.rightAlignStyle}
        value={this.state.isRTL} />
    </View>
  </View>
</RNTesterBlock>

_onDirectionChange = () => {
  I18nManager.forceRTL(!this.state.isRTL);
  this.setState({isRTL: !this.state.isRTL});
  Alert.alert('Reload this page',
   'Please reload this page to change the UI direction! ' +
   'All examples in this app will be affected. ' +
   'Check them out to see what they look like in RTL layout.'
  );
};
```

When working on a new feature, you can easily toggle this button and reload the app to see RTL layout. The benefit is you won't need to change the language setting to test, however some text alignment won't change, as explained in the next section. Therefore, it's always a good idea to test your app in the RTL language before launching.

## Limitations and Future Plan

The RTL support should cover most of the UX in your app; however, there are some limitations for now:

* Text alignment behaviors differ in iOS and Android
    * In iOS, the default text alignment depends on the active language bundle, they are consistently on one side. In Android, the default text alignment depends on the language of the text content, i.e. English will be left-aligned and Arabic will be right-aligned.
    * In theory, this should be made consistent across platform, but some people may prefer one behavior to another when using an app. More user experience research may be needed to find out the best practice for text alignment.


* There is no "true" left/right

    As discussed before, we map the `left`/`right` styles from the JS side to `start`/`end`, all `left` in code for RTL layout becomes "right" on screen, and `right` in code becomes "left" on screen. This is convenient because you don't need to change your product code too much, but it means there is no way to specify "true left" or "true right" in the code. In the future, allowing a component to control its direction regardless of the language may be necessary.

* Make RTL support for gestures and animations more developer friendly

   Currently, there is still some programming effort required to make gestures and animations RTL compatible.
   In the future, it would be ideal to find a way to make gestures and animations RTL support more developer friendly.

## Try it Out!
Check out the [`RTLExample`](https://github.com/facebook/react-native/blob/master/RNTester/js/RTLExample.js) in the `RNTester` to understand more about RTL support, and let us know how it works for you!

Finally, thank you for reading! We hope that the RTL support for React Native helps you grow your apps for international audience!
