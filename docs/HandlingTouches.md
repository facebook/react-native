---
id: handling-touches
title: Handling Touches
layout: docs
category: Guides
permalink: docs/handling-touches.html
next: animations
previous: more-resources
---

Users interact with mobile apps mainly through touch. They can use a combination of gestures, such as tapping on a button, scrolling a list, or zooming on a map.

React Native provides components to handle common gestures, such as taps and swipes, as well as a comprehensive [gesture responder system](docs/gesture-responder-system.html) to allow for more advanced gesture recognition.

## Tappable Components

You can use "Touchable" components when you want to capture a tapping gesture. They take a function through the `onPress` props which will be called when the touch begins and ends within the bounds of the component.

Example:

```javascript
class MyButton extends Component {
  _onPressButton() {
    console.log("You tapped the button!");
  }

  render() {
    return (
      <TouchableHighlight onPress={this._onPressButton}>
        <Text>Button</Text>
      </TouchableHighlight>
    );
  }
}
```

Tappable components should provide feedback that show the user what is handling their touch, and what will happen when they lift their finger. The user should also be able to cancel a tap by dragging their finger away.

Which component you use will depend on what kind of feedback you want to provide:

- Generally, you can use [**TouchableHighlight**](docs/touchablehighlight.html) anywhere you would use a button or link on web. The view's background will be darkened when the user presses down on the button.

- You may consider using [**TouchableNativeFeedback**](docs/touchablenativefeedback.html) on Android to display ink surface reaction ripples that respond to the user's touch.

- [**TouchableOpacity**](docs/touchableopacity.html) can be used to provide feedback by reducing the opacity of the button, allowing the background to be seen through while the user is pressing down.

- If you need to handle a tap gesture but you don't want any feedback to be displayed, use [**TouchableWithoutFeedback**](docs/touchablewithoutfeedback.html).

### Long presses

In some cases, you may want to detect when a user presses and holds a view for a set amount of time. These long presses can be handled by passing a function to the `onLongPress` props of any of the touchable components listed above.

## Scrolling lists and swiping views

A common pattern to many mobile apps is the scrollable list of items. Users interact with these using panning or swiping gestures. The [ScrollView](docs/using-a-scrollview.html) component displays a list of items that can be scrolled using these gestures.

ScrollViews can scroll vertically or horizontally, and can be configured to allow paging through views using swiping gestures by using the `pagingEnabled` props. Swiping horizontally between views can also be implemented on Android using the [ViewPagerAndroid](docs/viewpagerandroid.html) component.

A [ListView](docs/using-a-listview.html) is a special kind of ScrollView that is best suited for displaying long vertical lists of items. It can also display section headers and footers, similar to `UITableView`s on iOS.

### Pinch-to-zoom

A ScrollView with a single item can be used to allow the user to zoom content. Set up the `maximumZoomScale` and `minimumZoomScale` props and your user will be able to use pinch and expand gestures to zoom in and out.

## Handling additional gestures

If you want to allow a user to drag a view around the screen, or you want to implement your own custom pan/drag gesture, take a look at the [PanResponder](docs/panresponder.html) API or the [gesture responder system docs](docs/gesture-responder-system.html).
