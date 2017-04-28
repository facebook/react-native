---
id: accessibility
title: Accessibility
layout: docs
category: Guides
permalink: docs/accessibility.html
next: timers
previous: debugging
---

## Native App Accessibility (iOS and Android)
Both iOS and Android provide APIs for making apps accessible to people with disabilities. In addition, both platforms provide bundled assistive technologies, like the screen readers VoiceOver (iOS) and TalkBack (Android) for the visually impaired. Similarly, in React Native we have included APIs designed to provide developers with support for making apps more accessible. Take note, iOS and Android differ slightly in their approaches, and thus the React Native implementations may vary by platform.

In addition to this documentation, you might find [this blog post](https://code.facebook.com/posts/435862739941212/making-react-native-apps-accessible/) about React Native accessibility to be useful.

## Making Apps Accessible

### Accessibility properties

#### accessible (iOS, Android)

When `true`, indicates that the view is an accessibility element. When a view is an accessibility element, it groups its children into a single selectable component. By default, all touchable elements are accessible.

On Android, ‘accessible={true}’ property for a react-native View will be translated into native ‘focusable={true}’.

```javascript
<View accessible={true}>
  <Text>text one</Text>
  <Text>text two</Text>
</View>
```

In the above example, we can't get accessibility focus separately on 'text one' and 'text two'. Instead we get focus on a parent view with 'accessible' property.



#### accessibilityLabel (iOS, Android)

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

#### accessibilityTraits (iOS)

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

#### accessibilityViewIsModal (iOS)

A Boolean value indicating whether VoiceOver should ignore the elements within views that are siblings of the receiver.

For example, in a window that contains sibling views `A` and `B`, setting `accessibilityViewIsModal` to `true` on view `B` causes VoiceOver to ignore the elements in the view `A`.
On the other hand, if view `B` contains a child view `C` and you set `accessibilityViewIsModal` to `true` on view `C`, VoiceOver does not ignore the elements in view `A`.

#### onAccessibilityTap (iOS)

Use this property to assign a custom function to be called when someone activates an accessible element by double tapping on it while it's selected.

#### onMagicTap (iOS)

Assign this property to a custom function which will be called when someone performs the "magic tap" gesture, which is a double-tap with two fingers. A magic tap function should perform the most relevant action a user could take on a component. In the Phone app on iPhone, a magic tap answers a phone call, or ends the current one. If the selected element does not have an `onMagicTap` function, the system will traverse up the view hierarchy until it finds a view that does.

#### accessibilityComponentType (Android)

In some cases, we also want to alert the end user of the type of selected component (i.e., that it is a “button”). If we were using native buttons, this would work automatically. Since we are using javascript, we need to provide a bit more context for TalkBack. To do so, you must specify the ‘accessibilityComponentType’ property for any UI component. For instances, we support ‘button’, ‘radiobutton_checked’ and ‘radiobutton_unchecked’ and so on.

```javascript
<TouchableWithoutFeedback accessibilityComponentType=”button”
  onPress={this._onPress}>
  <View style={styles.button}>
    <Text style={styles.buttonText}>Press me!</Text>
  </View>
</TouchableWithoutFeedback>
```

In the above example, the TouchableWithoutFeedback is being announced by TalkBack as a native Button.

#### accessibilityLiveRegion (Android)

When components dynamically change, we want TalkBack to alert the end user. This is made possible by the ‘accessibilityLiveRegion’ property. It can be set to ‘none’, ‘polite’ and ‘assertive’:

* **none** Accessibility services should not announce changes to this view.
* **polite** Accessibility services should announce changes to this view.
* **assertive** Accessibility services should interrupt ongoing speech to immediately announce changes to this view.

```javascript
<TouchableWithoutFeedback onPress={this._addOne}>
  <View style={styles.embedded}>
    <Text>Click me</Text>
  </View>
</TouchableWithoutFeedback>
<Text accessibilityLiveRegion="polite">
  Clicked {this.state.count} times
</Text>
```

In the above example method _addOne changes the state.count variable. As soon as an end user clicks the TouchableWithoutFeedback, TalkBack reads text in the Text view because of its 'accessibilityLiveRegion=”polite”' property.

#### importantForAccessibility (Android)

In the case of two overlapping UI components with the same parent, default accessibility focus can have unpredictable behavior. The ‘importantForAccessibility’ property will resolve this by controlling if a view fires accessibility events and if it is reported to accessibility services. It can be set to ‘auto’, ‘yes’, ‘no’ and ‘no-hide-descendants’ (the last value will force accessibility services to ignore the component and all of its children).

```javascript
<View style={styles.container}>
  <View style={{position: 'absolute', left: 10, top: 10, right: 10, height: 100,
    backgroundColor: 'green'}} importantForAccessibility=”yes”>
    <Text> First layout </Text>
  </View>
  <View style={{position: 'absolute', left: 10, top: 10, right: 10, height: 100,
    backgroundColor: 'yellow'}} importantForAccessibility=”no-hide-descendants”>
    <Text> Second layout </Text>
  </View>
</View>
```

In the above example, the yellow layout and its descendants are completely invisible to TalkBack and all other accessibility services. So we can easily use overlapping views with the same parent without confusing TalkBack.

### Checking if a Screen Reader is Enabled

The `AccessibilityInfo` API allows you to determine whether or not a screen reader is currently active. See the [AccessibilityInfo documentation](docs/accessibilityinfo.html) for details.

### Sending Accessibility Events (Android)

Sometimes it is useful to trigger an accessibility event on a UI component (i.e. when a custom view appears on a screen or a custom radio button has been selected). Native UIManager module exposes a method ‘sendAccessibilityEvent’ for this purpose. It takes two arguments: view tag and a type of an event.

```javascript
_onPress: function() {
  this.state.radioButton = this.state.radioButton === “radiobutton_checked” ?
  “radiobutton_unchecked” : “radiobutton_checked”;
  if (this.state.radioButton === “radiobutton_checked”) {
    RCTUIManager.sendAccessibilityEvent(
      ReactNative.findNodeHandle(this),
      RCTUIManager.AccessibilityEventTypes.typeViewClicked);
  }
}

<CustomRadioButton
  accessibleComponentType={this.state.radioButton}
  onPress={this._onPress}/>
```

In the above example we've created a custom radio button that now behaves like a native one. More specifically, TalkBack now correctly announces changes to the radio button selection.


## Testing VoiceOver Support (iOS)

To enable VoiceOver, go to the Settings app on your iOS device. Tap General, then Accessibility. There you will find many tools that people use to use to make their devices more usable, such as bolder text, increased contrast, and VoiceOver.

To enable VoiceOver, tap on VoiceOver under "Vision" and toggle the switch that appears at the top.

At the very bottom of the Accessibility settings, there is an "Accessibility Shortcut". You can use this to toggle VoiceOver by triple clicking the Home button.
