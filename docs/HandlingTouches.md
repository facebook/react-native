---
id: handling-touches
title: Handling Touches
layout: docs
category: Guides
permalink: docs/handling-touches.html
next: animations
---

Users interact with your app mainly through touch. They can use a combination of gestures, such as tapping on a button, scrolling a list, or zooming on a map.

React Native provides built-in components for handling most common use cases such as taps and swipes. If you want to capture more advanced gestures, gesture responders provide a way to handle discrete touch events.

## Tappable Components

React Natives provides a set of `Touchable` components for things that should be "tappable".

Click on the name of the component to learn more about their use:

- [**TouchableHighlight**](/docs/touchablehighlight.html) - Feedback is provided by darkening the component on press. Generally, you can use `TouchableHighlight` anywhere you would use a button or link on web.

- [**TouchableNativeFeedback**](/docs/touchablenativefeedback.html) - Displays ink surface reaction ripples on press. Available on Android only.

- [**TouchableOpacity**](/docs/touchableopacity.html) - Feedback is provided by rendering the component transparent on press.

- [**TouchableWithoutFeedback**](/docs/touchablewithoutfeedback.html) - Handles touches without providing any feedback. Typically used when building UI components that should not display any feedback, such as tab bar items and back buttons.

### Long presses

In some cases, you may want to detect when a user presses and holds a view for a set amount of time. These long presses can be handled using a `TouchableWithoutFeedback` component and its `onLongPress` handler.

## Swipes and Multi-touch Gestures

In addition to taps, a touch may be used to scroll a list, slide a widget, or zoom in on content.

A touch can go through several phases as the app determines what the user's intention is. For example, the app needs to determine if the touch is scrolling, sliding on a widget, or tapping. This can even change during the duration of a touch. There can also be multiple, simultaneous touches.

### Scrolling lists and swiping views

A common pattern to many mobile apps is the scrollable list of items. Users interact with these using panning or swiping gestures. The `ScrollView` and `ListView` components display a list of items that can be scrolled using these gestures.

Swiping between views can be implemented in Android using the `ViewPagerAndroid` component.

### Pinching and zooming content

A `ScrollView` can be used for more than just lists. Set up the `maximumZoomScale` and `minimumZoomScale` parameters and your user will be able zoom your content using pinch gestures.

### Handling additional gestures

Many of the gestures discussed above are handled using `PanResponder`. If you want to allow a user to drag a view around the screen, or you want to implement your own custom pan/drag gesture, take a look at the [PanResponder](docs/panresponder.html) API o the [Gesture Responder System docs](docs/gesturerespondersystem.html).


## Best Practices

Your app should respond to gestures the way users expect: a pinch should zoom, and a tap should select something. Users can feel huge differences in the usability of web apps vs. native, and this is one of the big causes. Mosts actions should have the following attributes:

- **Feedback**: Show the user what is handling their touch, and what will happen when they release the gesture.
- **Cancel-ability**: The user should be able to abort an action mid-touch by dragging their finger away.

These features make users more comfortable while using an app, because it allows people to experiment and interact without fear of making mistakes.
