---
id: improvingux
title: Improving User Experience
layout: docs
category: Guides
permalink: docs/improvingux.html
next: timers
previous: accessibility
---

Building apps for mobile platforms is nuanced.

> We are improving and adding more details to this page. If you'd like to help out, chime in at [react-native/14979](https://github.com/facebook/react-native/issues/14979).

## Make tappable areas larger

On mobile phone it's hard to be very precise when pressing buttons. Make sure all interactive elements are 44x44 or larger. One way to do this is to leave enough space for the element, `padding`, `minWidth` and `minHeight` style values can be useful for that. Alternatively, you can use [`hitSlop` prop](docs/touchablewithoutfeedback.html#hitslop) to increase interactive area without affecting the layout. Here's a demo:

<video src="img/hitslop.mp4" autoplay loop width="320" height="120"></video>

[Try it on your phone](https://snack.expo.io/rJPwCt4HZ)

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

# Learn more

[Material Design](https://material.io/) and [Human Interface Guidelines](https://developer.apple.com/ios/human-interface-guidelines/overview/design-principles/) are great resources for learning more about designing for mobile platforms.
