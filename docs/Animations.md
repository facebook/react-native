---
id: animations
title: Animations
layout: docs
category: Guides
permalink: docs/animations.html
next: accessibility
---

Fluid, meaningful animations are essential to the mobile user
experience. Animation APIs for React Native are currently under heavy
development, the recommendations in this article are intended to be up
to date with the current best-practices.

### requestAnimationFrame

`requestAnimationFrame` is a polyfill from the browser that you might be
familiar with. It accepts a function as its only argument and calls that
function before the next repaint. It is an essential building block for
animations that underlies all of the JavaScript-based animation APIs.

### JavaScript-based Animation APIs

These APIs do all of the calculations in JavaScript, then send over
updated properties to the native side on each frame.

#### react-tween-state

[react-tween-state](https://github.com/chenglou/react-tween-state) is a
minimal library that does exactly what its name suggests: it *tweens* a
value in a component's state, starting at a **from** value and ending at
a **to** value. This means that it generates the values in between those
two values, and it sets the state on every `requestAnimationFrame` with
the intermediary value.

> Tweening definition from [Wikipedia](https://en.wikipedia.org/wiki/Inbetweening)
>
> "... tweening is the process of generating intermediate frames between two
> images to give the appearance that the first image evolves smoothly
> into the second image. [Tweens] are the drawings between the key
> frames which help to create the illusion of motion."

The most obvious way to animate from one value to another is linearly:
you subtract the end value from the start value and divide the result by
the number of frames over which the animation occurs, and then add that
value to the current value on each frame until the end value is reached.
Linear easing often looks awkward and unnatural, so react-tween-state
provides a selection of popular [easing functions](http://easings.net/)
that can be applied to make your animations more pleasing.

This library does not ship with React Native - in order to use it on
your project, you will need to install it with `npm i react-tween-state
--save` from your project directory.

```javascript
var tweenState = require('react-tween-state');

var App = React.createClass({
  mixins: [tweenState.Mixin],

  getInitialState() {
    return { opacity: 1 }
  },

  _animateOpacity() {
    this.tweenState('opacity', {
      easing: tweenState.easingTypes.easeOutQuint,
      duration: 1000,
      endValue: this.state.opacity === 0.2 ? 1 : 0.2,
    });
  },

  render() {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <TouchableWithoutFeedback onPress={this._animateOpacity}>
          <View ref={component => this._box = component}
                style={{width: 200, height: 200, backgroundColor: 'red',
                        opacity: this.getTweeningValue('opacity')}} />
        </TouchableWithoutFeedback>
      </View>
    )
  },
});
```
[Run this example](https://rnplay.org/apps/4FUQ-A)

![](/react-native/img/TweenState.gif)

Here we animated the opacity, but as you might guess, we can animate any
numeric value. Read more about react-tween-state in its
[README](https://github.com/chenglou/react-tween-state).

#### Rebound

[Rebound.js](https://github.com/facebook/rebound-js) is a JavaScript port of
[Rebound for Android](https://github.com/facebook/rebound). It is
similar in concept to react-tween-state: you have an initial value and
set an end value, then Rebound generates intermediate values that you can
use for your animation. Rebound is modeled after spring physics; we
don't provide a duration when animating with springs, it is
calculated for us depending on the spring tension, friction, current
value and end value.  Rebound [is used
internally](https://github.com/facebook/react-native/search?utf8=%E2%9C%93&q=rebound)
by React Native on `Navigator` and `WarningBox`.

![](/react-native/img/ReboundImage.gif)

Notice that Rebound animations can be interrupted - if you release in
the middle of a press, it will animate back from the current state to
the original value.

```javascript
var rebound = require('rebound');

var App = React.createClass({
  // First we initialize the spring and add a listener, which calls
  // setState whenever it updates
  componentWillMount() {
    // Initialize the spring that will drive animations
    this.springSystem = new rebound.SpringSystem();
    this._scrollSpring = this.springSystem.createSpring();
    var springConfig = this._scrollSpring.getSpringConfig();
    springConfig.tension = 230;
    springConfig.friction = 10;

    this._scrollSpring.addListener({
      onSpringUpdate: () => {
        this.setState({scale: this._scrollSpring.getCurrentValue()});
      },
    });

    // Initialize the spring value at 1
    this._scrollSpring.setCurrentValue(1);
  },

  _onPressIn() {
    this._scrollSpring.setEndValue(0.5);
  },

  _onPressOut() {
    this._scrollSpring.setEndValue(1);
  },

  render: function() {
    var imageStyle = {
      width: 250,
      height: 200,
      transform: [{scaleX: this.state.scale}, {scaleY: this.state.scale}],
    };

    var imageUri = "https://facebook.github.io/react-native/img/ReboundExample.png";

    return (
      <View style={styles.container}>
        <TouchableWithoutFeedback onPressIn={this._onPressIn}
                                  onPressOut={this._onPressOut}>
          <Image source={{uri: imageUri}} style={imageStyle} />
        </TouchableWithoutFeedback>
      </View>
    );
  }
});
```
[Run this example](https://rnplay.org/apps/NNI5eA)

You can also clamp the spring values so that they don't overshoot and
oscillate around the end value. In the above example, we would add
`this._scrollSpring.setOvershootClampingEnabled(true)` to change this.
See the below gif for an example of where in your interface you might
use this.

![](/react-native/img/Rebound.gif) Screenshot from
[react-native-scrollable-tab-view](https://github.com/brentvatne/react-native-scrollable-tab-view).
You can run a simlar example [here](https://rnplay.org/apps/qHU_5w).

#### A sidenote about setNativeProps

As mentioned [in the Direction Manipulation section](/react-native/docs/direct-manipulation.html),
`setNativeProps` allows us to modify properties of native-backed
components (components that are actually backed by native views, unlike
composite components) directly, without having to `setState` and
re-render the component hierarchy.

We could use this in the Rebound example to update the scale - this
might be helpful if the component that we are updating is deeply nested
and hasn't been optimized with `shouldComponentUpdate`.

```javascript
// Outside of our React component
var precomputeStyle = require('precomputeStyle');

// Back inside of the App component, replace the scrollSpring listener
// in componentWillMount with this:
this._scrollSpring.addListener({
  onSpringUpdate: () => {
    if (!this._photo) { return }
    var v = this._scrollSpring.getCurrentValue();
    var newProps = precomputeStyle({transform: [{scaleX: v}, {scaleY: v}]});
    this._photo.setNativeProps(newProps);
  },
});

// Lastly, we update the render function to no longer pass in the
// transform via style (avoid clashes when re-rendering) and to set the
// photo ref
render: function() {
  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPressIn={this._onPressIn} onPressOut={this._onPressOut}>
        <Image ref={component => this._photo = component}
               source={{uri: "https://facebook.github.io/react-native/img/ReboundExample.png"}}
               style={{width: 250, height: 200}} />
      </TouchableWithoutFeedback>
    </View>
  );
}
```
[Run this example](https://rnplay.org/apps/fUqjAg)

It would not make sense to use `setNativeProps` with react-tween-state
because the updated tween values are set on the state automatically by
the library - Rebound on the other hand gives us an updated value for
each frame with the `onSpringUpdate` function.

If you find your animations with dropping frames (performing below 60
frames per second), look into using `setNativeProps` or
`shouldComponentUpdate` to optimize them. You may also want to defer any
computationally intensive work until after animations are complete,
using the
[InteractionManager](/react-native/docs/interactionmanager.html). You
can monitor the frame rate by using the In-App Developer Menu "FPS
Monitor" tool.

#### Navigator Scene Transitions

As mentioned in the [Navigator
Comparison](https://facebook.github.io/react-native/docs/navigator-comparison.html#content),
`Navigator` is implemented in JavaScript and `NavigatorIOS` is a wrapper
around native functionality provided by `UINavigationController`, so
these scene transitions apply only to `Navigator`. In order to re-create
the various animations provided by `UINavigationController` and also
make them customizable, React Native exposes a
[NavigatorSceneConfigs](https://github.com/facebook/react-native/blob/master/Libraries/CustomComponents/Navigator/NavigatorSceneConfigs.js) API.

```javascript
var SCREEN_WIDTH = require('Dimensions').get('window').width;
var BaseConfig = Navigator.SceneConfigs.FloatFromRight;

var CustomLeftToRightGesture = Object.assign({}, BaseConfig.gestures.pop, {
  // Make it snap back really quickly after canceling pop
  snapVelocity: 8,

  // Make it so we can drag anywhere on the screen
  edgeHitWidth: SCREEN_WIDTH,
});

var CustomSceneConfig = Object.assign({}, BaseConfig, {
  // A very tighly wound spring will make this transition fast
  springTension: 100,
  springFriction: 1,

  // Use our custom gesture defined above
  gestures: {
    pop: CustomLeftToRightGesture,
  }
});
```
[Run this example](https://rnplay.org/apps/HPy6UA)

For further information about customizing scene transitions, [read the
source](https://github.com/facebook/react-native/blob/master/Libraries/CustomComponents/Navigator/NavigatorSceneConfigs.js).

### Native-based Animation APIs

#### LayoutAnimation

LayoutAnimation allows you to globally configure `create` and `update`
animations that will be used for all views in the next render cycle.

![](/react-native/img/LayoutAnimationExample.gif)

```javascript
var App = React.createClass({
  componentWillMount() {
    // Animate creation
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
  },

  getInitialState() {
    return { w: 100, h: 100 }
  },

  _onPress() {
    // Animate the update
    LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    this.setState({w: this.state.w + 15, h: this.state.h + 15})
  },

  render: function() {
    return (
      <View style={styles.container}>
        <View style={[styles.box, {width: this.state.w, height: this.state.h}]} />
        <TouchableOpacity onPress={this._onPress}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>Press me!</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }
});
```
[Run this example](https://rnplay.org/apps/uaQrGQ)

This example uses a preset value, you can customize the animations as
you need, see [LayoutAnimation.js](https://github.com/facebook/react-native/blob/master/Libraries/Animation/LayoutAnimation.js)
for more information.

#### AnimationExperimental *(Deprecated)*

As the name would suggest, this was only ever an experimental API and it
is **not recommended to use this on your apps**. It has some rough edges
and is not under active development. It is built on top of CoreAnimation
explicit animations.

If you choose to use it anyways, here is what you need to know:

- You will need to include `RCTAnimationExperimental.xcodeproj` and add
  `libRCTAnimationExperimental.a` to `Build Phases`.
- Suited only for static "fire and forget" animations - not continuous gestures.
- Hit detection will not work as expected because animations occur on
  the presentation layer.

```javascript
var AnimationExperimental = require('AnimationExperimental');

var App = React.createClass({
  componentDidMount() {
    AnimationExperimental.startAnimation(
      {
        node: this._box,
        duration: 1000,
        easing: 'easeInOutBack',
        property: 'scaleXY',
        toValue: { x: 1, y: 1 },
      },
    );
  },

  render() {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <View ref={component => this._box = component}
              style={{width: 200, height: 200, backgroundColor: 'red'}} />
      </View>
    )
  },
});
```
![](/react-native/img/AnimationExperimentalScaleXY.gif)

Now to demonstrate a known issue, and one of the reasons why it is
recommended not to use `AnimationExperimental` currently, let's try to
animate `opacity` from 1 to 0.5:

```javascript
AnimationExperimental.startAnimation(
  {
    node: this._box,
    duration: 1000,
    easing: 'easeInOutBack',
    property: 'opacity',
    fromValue: 1,
    toValue: 0.5,
  },
);
```

![](/react-native/img/AnimationExperimentalOpacity.gif)

#### Pop *(Unsupported, not recommended)*

[Facebook Pop](https://github.com/facebook/pop) "supports spring and
decay dynamic animations, making it useful for building realistic,
physics-based interactions."

This is not officially supported or recommended because the direction is
to move towards JavaScript-driven animations, but if you must use it,
you can find the code to integrate with React Native
[here](https://github.com/facebook/react-native/issues/1365#issuecomment-104792251).
Please do not open questions specific to Pop on the React Native issues,
StackOverflow is a better place to answer those questions as it is not
considered to be part of the core.
