---
id: accessibility
title: Accessibility (iOS)
layout: docs
category: Guides
permalink: docs/accessibility.html
next: native-modules-ios
---

Accessibility on iOS encompasses many topics, but for many, accessibility is synonymous with VoiceOver, a technology available since iOS 3.0. It acts as a screen reader, allowing people with visual impairments to use their iOS devices. Click [here](https://developer.apple.com/accessibility/ios/) to learn more.

## Making Accessible Apps

### Coding Accessibly

#### accessible

When `true`, indicates that the view is an accessibility element. When a view is an accessibility element, it groups its children into a single selectable component. By default, all touchable elements are accessible.

#### accessibilityLabel

When a view is marked as accessible, it is a good practice to set an accessibilityLabel on the view, so that people who use VoiceOver know what element they have selected. VoiceOver will read this string when a user selects the associated element.

To use, set the `accessibilityLabel` property to a custom string on your View:

```javascript
<TouchableOpacity accessible={true} accessibilityLabel={'Tap me!'} onPress={this._onPress}>
  <View style={styles.button}>
    <Text style={styles.buttonText}>Press me!</Text>
  </View>
</TouchableOpacity>
```

In the above example, the `accessibilityLabel` on the TouchableOpacity element would default to "Press me!". The label is constructed by concatenating all Text node children separated by spaces.

#### accessibilityTraits

Accessibility traits tell a person using VoiceOver what kind of element they have selected. Is this element a label? A button? A header? These questions are answered by `accessibilityTraits`.

To use, set the `accessibilityTraits` property to one of (or an array of) accessibility trait strings:

* **none** Used when the element has no traits.
* **button** Used when the element should be treated as a button.
* **link** Used when the element should be treated as a link.
* **header** Used when an element acts as a header for a content section (e.g. the title of a navigation bar).
* **search** Used when the text field element should also be treated as a search field.
* **image** Used when the element should be treated as an image. Can be combined with button or link, for example.
* **selected**  Used when the element is selected. For example, a selected row in a table or a selected button within a segmented control.
* **plays** Used when the element plays its own sound when activated.
* **key** Used when the element acts as a keyboard key.
* **text** Used when the element should be treated as static text that cannot change.
* **summary** Used when an element can be used to provide a quick summary of current conditions in the app when the app first launches.  For example, when Weather first launches, the element with today's weather conditions is marked with this trait.
* **disabled** Used when the control is not enabled and does not respond to user input.
* **frequentUpdates** Used when the element frequently updates its label or value, but too often to send notifications. Allows an accessibility client to poll for changes. A stopwatch would be an example.
* **startsMedia** Used when activating an element starts a media session (e.g. playing a movie, recording audio) that should not be interrupted by output from an assistive technology, like VoiceOver.
* **adjustable** Used when an element can be "adjusted" (e.g. a slider).
* **allowsDirectInteraction** Used when an element allows direct touch interaction for VoiceOver users (for example, a view representing a piano keyboard).
* **pageTurn** Informs VoiceOver that it should scroll to the next page when it finishes reading the contents of the element.

#### onAccessibilityTap

Use this property to assign a custom function to be called when someone activates an accessible element by double tapping on it while it's selected.

#### onMagicTap

Assign this property to a custom function which will be called when someone performs the "magic tap" gesture, which is a double-tap with two fingers. A magic tap function should perform the most relevant action a user could take on a component. In the Phone app on iPhone, a magic tap answers a phone call, or ends the current one. If the selected element does not have an `onMagicTap` function, the system will traverse up the view hierarchy until it finds a view that does.

### Testing VoiceOver Support

To enable VoiceOver, go to the Settings app on your iOS device. Tap General, then Accessibility. There you will find many tools that people use to use to make their devices more usable, such as bolder text, increased contrast, and VoiceOver.

To enable VoiceOver, tap on VoiceOver under "Vision" and toggle the switch that appears at the top.

At the very bottom of the Accessibility settings, there is an "Accessibility Shortcut". You can use this to toggle VoiceOver by triple clicking the Home button.
