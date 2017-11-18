---
id: animated
title: Animated
layout: docs
category: APIs
permalink: docs/animated.html
next: animatedvalue
previous: alertios
---

The `Animated` library is designed to make animations fluid, powerful, and
easy to build and maintain. `Animated` focuses on declarative relationships
between inputs and outputs, with configurable transforms in between, and
simple `start`/`stop` methods to control time-based animation execution.

The simplest workflow for creating an animation is to create an
`Animated.Value`, hook it up to one or more style attributes of an animated
component, and then drive updates via animations using `Animated.timing()`:

```javascript
Animated.timing(                            // Animate value over time
  this.state.fadeAnim,                      // The value to drive
  {
    toValue: 1,                             // Animate to final value of 1
  }
).start();                                  // Start the animation
```

Refer to the [Animations](docs/animations.html#animated-api) guide to see
additional examples of `Animated` in action.

## Overview

There are two value types you can use with `Animated`:

- [`Animated.Value()`](docs/animated.html#value) for single values
- [`Animated.ValueXY()`](docs/animated.html#valuexy) for vectors

`Animated.Value` can bind to style properties or other props, and can be
interpolated as well. A single `Animated.Value` can drive any number of
properties.

### Configuring animations

`Animated` provides three types of animation types. Each animation type
provides a particular animation curve that controls how your values animate
from their initial value to the final value:

- [`Animated.decay()`](docs/animated.html#decay) starts with an initial
  velocity and gradually slows to a stop.
- [`Animated.spring()`](docs/animated.html#spring) provides a simple
  spring physics model.
- [`Animated.timing()`](docs/animated.html#timing) animates a value over time
  using [easing functions](docs/easing.html).

In most cases, you will be using `timing()`. By default, it uses a symmetric
easeInOut curve that conveys the gradual acceleration of an object to full
speed and concludes by gradually decelerating to a stop.

### Working with animations

Animations are started by calling `start()` on your animation. `start()`
takes a completion callback that will be called when the animation is done.
If the animation finished running normally, the completion callback will be
invoked with `{finished: true}`. If the animation is done because `stop()`
was called on it before it could finish (e.g. because it was interrupted by a
gesture or another animation), then it will receive `{finished: false}`.

### Using the native driver

By using the native driver, we send everything about the animation to native
before starting the animation, allowing native code to perform the animation
on the UI thread without having to go through the bridge on every frame.
Once the animation has started, the JS thread can be blocked without
affecting the animation.

You can use the native driver by specifying `useNativeDriver: true` in your
animation configuration. See the
[Animations](docs/animations.html#using-the-native-driver) guide to learn
more.

### Animatable components

Only animatable components can be animated. These special components do the
magic of binding the animated values to the properties, and do targeted
native updates to avoid the cost of the react render and reconciliation
process on every frame. They also handle cleanup on unmount so they are safe
by default.

- [`createAnimatedComponent()`](docs/animated.html#createanimatedcomponent)
  can be used to make a component animatable.

`Animated` exports the following animatable components using the above
wrapper:

- `Animated.Image`
- `Animated.ScrollView`
- `Animated.Text`
- `Animated.View`

### Composing animations

Animations can also be combined in complex ways using composition functions:

- [`Animated.delay()`](docs/animated.html#delay) starts an animation after
  a given delay.
- [`Animated.parallel()`](docs/animated.html#parallel) starts a number of
  animations at the same time.
- [`Animated.sequence()`](docs/animated.html#sequence) starts the animations
  in order, waiting for each to complete before starting the next.
- [`Animated.stagger()`](docs/animated.html#stagger) starts animations in
  order and in parallel, but with successive delays.

Animations can also be chained together simply by setting the `toValue` of
one animation to be another `Animated.Value`. See
[Tracking dynamic values](docs/animations.html#tracking-dynamic-values) in
the Animations guide.

By default, if one animation is stopped or interrupted, then all other
animations in the group are also stopped.

### Combining animated values

You can combine two animated values via addition, multiplication, division,
or modulo to make a new animated value:

- [`Animated.add()`](docs/animated.html#add)
- [`Animated.divide()`](docs/animated.html#divide)
- [`Animated.modulo()`](docs/animated.html#modulo)
- [`Animated.multiply()`](docs/animated.html#multiply)

### Interpolation

The `interpolate()` function allows input ranges to map to different output
ranges. By default, it will extrapolate the curve beyond the ranges given,
but you can also have it clamp the output value. It uses lineal interpolation
by default but also supports easing functions.

- [`interpolate()`](docs/animated.html#interpolate)

Read more about interpolation in the
[Animation](docs/animations.html#interpolation) guide.

### Handling gestures and other events

Gestures, like panning or scrolling, and other events can map directly to
animated values using `Animated.event()`. This is done with a structured map
syntax so that values can be extracted from complex event objects. The first
level is an array to allow mapping across multiple args, and that array
contains nested objects.

- [`Animated.event()`](docs/animated.html#event)

For example, when working with horizontal scrolling gestures, you would do
the following in order to map `event.nativeEvent.contentOffset.x` to
`scrollX` (an `Animated.Value`):

```javascript
 onScroll={Animated.event(
   // scrollX = e.nativeEvent.contentOffset.x
   [{ nativeEvent: {
        contentOffset: {
          x: scrollX
        }
      }
    }]
 )}
```



### Methods

- [`decay`](docs/animated.html#decay)
- [`timing`](docs/animated.html#timing)
- [`spring`](docs/animated.html#spring)
- [`add`](docs/animated.html#add)
- [`divide`](docs/animated.html#divide)
- [`multiply`](docs/animated.html#multiply)
- [`modulo`](docs/animated.html#modulo)
- [`diffClamp`](docs/animated.html#diffclamp)
- [`delay`](docs/animated.html#delay)
- [`sequence`](docs/animated.html#sequence)
- [`parallel`](docs/animated.html#parallel)
- [`stagger`](docs/animated.html#stagger)
- [`loop`](docs/animated.html#loop)
- [`event`](docs/animated.html#event)
- [`createAnimatedComponent`](docs/animated.html#createanimatedcomponent)
- [`attachNativeEvent`](docs/animated.html#attachnativeevent)
- [`forkEvent`](docs/animated.html#forkevent)
- [`unforkEvent`](docs/animated.html#unforkevent)

### Properties

- [`Value`](docs/animated.html#value)
- [`ValueXY`](docs/animated.html#valuexy)
- [`Interpolation`](docs/animated.html#interpolation)
- [`Node`](docs/animated.html#node)




---

# Reference

## Methods

### `decay()`

```javascript
static decay(value, config)
```

Animates a value from an initial velocity to zero based on a decay coefficient.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| value | AnimatedValue or AnimatedValueXY | Yes | Value to animate. |
| config | object | Yes | See below. |

Config is an object that may have the following options:

- `velocity`: Initial velocity. Required.
- `deceleration`: Rate of decay. Default 0.997.
- `isInteraction`: Whether or not this animation creates an "interaction handle" on the
  `InteractionManager`. Default true.
- `useNativeDriver`: Uses the native driver when true. Default false.

---

### `timing()`

```javascript
static timing(value, config)
```

Animates a value along a timed easing curve. The [`Easing`](docs/easing.html) module has tons of predefined curves, or you can use your own function.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| value | AnimatedValue or AnimatedValueXY | Yes | Value to animate. |
| config | object | Yes | See below. |

Config is an object that may have the following options:

  - `duration`: Length of animation (milliseconds).  Default 500.
  - `easing`: Easing function to define curve.
    Default is `Easing.inOut(Easing.ease)`.
  - `delay`: Start the animation after delay (milliseconds).  Default 0.
  - `isInteraction`: Whether or not this animation creates an "interaction handle" on the
    `InteractionManager`. Default true.
  - `useNativeDriver`: Uses the native driver when true. Default false.




---

### `spring()`

```javascript
static spring(value, config)
```

Animates a value according to an analytical spring model based on [damped harmonic oscillation](https://en.wikipedia.org/wiki/Harmonic_oscillator#Damped_harmonic_oscillator). Tracks velocity state to create fluid motions as the `toValue` updates, and can be chained together.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| value | AnimatedValue or AnimatedValueXY | Yes | Value to animate. |
| config | object | Yes | See below. |

`config` is an object that may have the following options.

Note that you can only define one of bounciness/speed, tension/friction, or stiffness/damping/mass, but not more than one:

The friction/tension or bounciness/speed options match the spring model in [Facebook Pop](https://github.com/facebook/pop), [Rebound](http://facebook.github.io/rebound/), and [Origami](http://origami.design/).

- `friction`: Controls "bounciness"/overshoot.  Default 7.
- `tension`: Controls speed.  Default 40.
- `speed`: Controls speed of the animation. Default 12.
- `bounciness`: Controls bounciness. Default 8.

Specifying stiffness/damping/mass as parameters makes `Animated.spring` use an analytical spring model based on the motion equations of a [damped harmonic oscillator](https://en.wikipedia.org/wiki/Harmonic_oscillator#Damped_harmonic_oscillator). This behavior is slightly more precise and faithful to the physics behind spring dynamics, and closely mimics the implementation in iOS's CASpringAnimation primitive.

- `stiffness`: The spring stiffness coefficient. Default 100.
- `damping`: Defines how the spring’s motion should be damped due to the forces of friction. Default 10.
- `mass`: The mass of the object attached to the end of the spring. Default 1.

Other configuration options are as follows:

- `velocity`: The initial velocity of the object attached to the spring. Default 0 (object is at rest).
- `overshootClamping`: Boolean indiciating whether the spring should be clamped and not bounce. Default false.
- `restDisplacementThreshold`: The threshold of displacement from rest below which the spring should be considered at rest. Default 0.001.
- `restSpeedThreshold`: The speed at which the spring should be considered at rest in pixels per second. Default 0.001.
- `delay`: Start the animation after delay (milliseconds).  Default 0.
- `isInteraction`: Whether or not this animation creates an "interaction handle" on the `InteractionManager`. Default true.
- `useNativeDriver`: Uses the native driver when true. Default false.

---

### `add()`

```javascript
static add(a, b)
```

Creates a new Animated value composed from two Animated values added together.


**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| a | AnimatedValue | Yes | Operand. |
| b | AnimatedValue | Yes | Operand. |



---

### `divide()`

```javascript
static divide(a, b)
```


Creates a new Animated value composed by dividing the first Animated value by the second Animated value.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| a | AnimatedValue | Yes | Operand. |
| b | AnimatedValue | Yes | Operand. |


---

### `multiply()`

```javascript
static multiply(a, b)
```

Creates a new Animated value composed from two Animated values multiplied together.


**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| a | AnimatedValue | Yes | Operand. |
| b | AnimatedValue | Yes | Operand. |

---

### `modulo()`

```javascript
static modulo(a, modulus)
```


Creates a new Animated value that is the (non-negative) modulo of the provided Animated value.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| a | AnimatedValue | Yes | Operand. |
| modulus | AnimatedValue | Yes | Operand. |


---

### `diffClamp()`

```javascript
static diffClamp(a, min, max)
```

Create a new Animated value that is limited between 2 values. It uses the difference between the last value so even if the value is far from the bounds it will start changing when the value starts getting closer again. (`value = clamp(value + diff, min, max)`).

This is useful with scroll events, for example, to show the navbar when scrolling up and to hide it when scrolling down.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| a | AnimatedValue | Yes | Operand. |
| min | number | Yes | Minimum value. |
| max | number | Yes | Maximum value. |

---

### `delay()`

```javascript
static delay(time)
```

Starts an animation after the given delay.


**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| time | number | Yes | Delay in milliseconds. |

---

### `sequence()`

```javascript
static sequence(animations)
```

Starts an array of animations in order, waiting for each to complete before starting the next.  If the current running animation is stopped, no following animations will be started.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| animations | array | Yes | Array of animations. |



---

### `parallel()`

```javascript
static parallel(animations, [config])
```

Starts an array of animations all at the same time. By default, if one
of the animations is stopped, they will all be stopped. You can override
this with the `stopTogether` flag through `config`.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| animations | array | Yes | Array of animations. |
| config | object | No | An object with a `stopTogether` key (boolean). |


---

### `stagger()`

```javascript
static stagger(time, animations)
```

Array of animations may run in parallel (overlap), but are started in
sequence with successive delays.  Nice for doing trailing effects.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| time | number | Yes | Delay in milliseconds. |
| animations | array | Yes | Array of animations. |

---

### `loop()`

```javascript
static loop(animation)
```

Loops a given animation continuously, so that each time it reaches the end, it resets and begins again from the start. Can specify number of times to loop using the key `iterations` in the config. Will loop without blocking the UI thread if the child animation is set to `useNativeDriver: true`. In addition, loops can prevent `VirtualizedList`-based components from rendering more rows while the animation is running. You can pass `isInteraction: false` in the child animation config to fix this.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| animation | animation | Yes | Animation to loop. |

---

### `event()`

```javascript
static event(argMapping, [config])
```

Takes an array of mappings and extracts values from each arg accordingly, then calls `setValue` on the mapped outputs. e.g.

```javascript
onScroll={Animated.event(
  [{nativeEvent: {contentOffset: {x: this._scrollX}}}],
  {listener: (event) => console.log(event)}, // Optional async listener
)}
...
onPanResponderMove: Animated.event([
  null,                // raw event arg ignored
  {dx: this._panX},    // gestureState arg
  {listener: (event, gestureState) => console.log(event, gestureState)}, // Optional async listener
]),
```

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| argMapping | array | Yes | Array of mappings. |
| config | object | No | See below. |


Config is an object that may have the following options:

- `listener`: Optional async listener.
- `useNativeDriver`: Uses the native driver when true. Default false.

---

### `createAnimatedComponent()`

```javascript
createAnimatedComponent(component)
```

Make any React component Animatable. Used to create `Animated.View`, etc.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| component | component | Yes | React component |

---

### `attachNativeEvent()`

```javascript
attachNativeEvent(viewRef, eventName, argMapping)
```

Imperative API to attach an animated value to an event on a view. Prefer using `Animated.event` with `useNativeDrive: true` if possible.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| viewRef | any | Yes | View reference. |
| eventName | string | Yes | Event name. |
| argMapping | array | Yes | Array of mappings. |

---

### `forkEvent()`

```javascript
static forkEvent(event, listener)
```

Advanced imperative API for snooping on animated events that are passed in through props. Use values directly where possible.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| event | event or function | Yes | Event. |
| listener | function | Yes | Handler. |

---

### `unforkEvent()`

```javascript
static unforkEvent(event, listener)
```

Advanced imperative API for snooping on animated events that are passed in through props. Use values directly where possible.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| event | event or function | Yes | Event. |
| listener | function | Yes | Handler. |


## Properties

### Value

Standard value for driving animations.

| Type |
| - |
| [`AnimatedValue`](docs/animatedvalue.html) |

---

### ValueXY

2D value class for driving 2D animations, such as pan gestures.

| Type |
| - |
| [`AnimatedValueXY`](docs/animatedvaluexy.html) |

---

### Interpolation

Exported to use the Interpolation type in flow.

| Type |
| - |
| AnimatedInterpolation |

---

### Node

Exported for ease of type checking. All animated values derive from this class. See `AnimatedNode.js`.

| Type |
| - |
| AnimatedNode |

