---
id: improvingux
title: Improving User Experience
layout: docs
category: Guides
permalink: docs/improvingux.html
next: timers
previous: accessibility
---

Building apps for mobile platforms is nuanced, there are many little details that developers coming from a web background often do not consider. This guide is intended to explain some of these nuances and demonstrate how you might factor them in to your application.

> We are improving and adding more details to this page. If you'd like to help out, chime in at [react-native/14979](https://github.com/facebook/react-native/issues/14979).


## Topics index

- [Configure text inputs](#configure-text-inputs)
- [Manage layout when keyboard is visible](#manage-layout-when-keyboard-is-visible)
- [Make tappable areas larger](#make-tappable-areas-larger)
- [Use Android Ripple](#use-android-ripple)
- [Learn More](#learn-more)

-------------------------------------------------------------------------------

## Configure text inputs

Entering text on touch phone is a challange - small screen, software keyboard. But based on what kind of data you need, you can make it easier by properly configuring the text inputs:

* Focus the first field automatically
* Use placeholder text as an example of expected data format
* Enable or disable autocapitalization and autocorrect
* Choose keyboard type (e.g. email, numeric)
* Make sure the return button focuses the next field or submits the form

Check out [`TextInput` docs](docs/textinput.html) for more configuration options.

<video src="img/textinput.mp4" autoplay loop width="320" height="430"></video>

[Try it on your phone](https://snack.expo.io/H1iGt2vSW)

## Manage layout when keyboard is visible

Software keyboard takes almost half of the screen. If you have interactive elements that can get covered by the keyboard, make sure they are still accessible by using `KeyboardAvoidingView` ([see docs](docs/keyboardavoidingview.html)).

<video src="img/keyboardavoidingview.mp4" autoplay loop width="320" height="448"></video>

[Try it on your phone](https://snack.expo.io/ryxRkwnrW)

## Make tappable areas larger

On mobile phones it's hard to be very precise when pressing buttons. Make sure all interactive elements are 44x44 or larger. One way to do this is to leave enough space for the element, `padding`, `minWidth` and `minHeight` style values can be useful for that. Alternatively, you can use [`hitSlop` prop](docs/touchablewithoutfeedback.html#hitslop) to increase interactive area without affecting the layout. Here's a demo:

<video src="img/hitslop.mp4" autoplay loop width="320" height="120"></video>

[Try it on your phone](https://snack.expo.io/rJPwCt4HZ)

## Use Android Ripple

Android API 21+ uses the material design ripple to provide user with feedback when they touch an interactable area on the screen. React Native exposes this through the [`TouchableNativeFeedback` component](docs/docs/touchablenativefeedback.html). Using this touchable effect instead of opacity or highlight will often make your app feel much more fitting on the platform. That said, you need to be careful when using it because it doesn't work on iOS or on Android API < 21, so you will need to fallback to using one of the other Touchable components on iOS. You can use a library like [react-native-platform-touchable](https://github.com/react-community/react-native-platform-touchable) to handle the platform differences for you.

<video src="img/ripple.mp4" autoplay loop width="320"></video>

[Try it on your phone](https://snack.expo.io/SJywqe3rZ)

# Learn more

[Material Design](https://material.io/) and [Human Interface Guidelines](https://developer.apple.com/ios/human-interface-guidelines/overview/design-principles/) are great resources for learning more about designing for mobile platforms.
