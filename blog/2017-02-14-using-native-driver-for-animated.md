---
title: Using Native Driver for Animated
author: Janic Duplessis
authorTitle: Software Engineer at App & Flow
authorURL: https://twitter.com/janicduplessis
authorImage: https://secure.gravatar.com/avatar/8d6b6c0f5b228b0a8566a69de448b9dd?s=128
authorTwitter: janicduplessis
category: engineering
---

For the past year, we've been working on improving performance of animations that use the Animated library. Animations are very important to create a beautiful user experience but can also be hard to do right. We want to make it easy for developers to create performant animations without having to worry about some of their code causing it to lag.

## What is this?

The Animated API was designed with a very important constraint in mind, it is serializable. This means we can send everything about the animation to native before it has even started and allows native code to perform the animation on the UI thread without having to go through the bridge on every frame. It is very useful because once the animation has started, the JS thread can be blocked and the animation will still run smoothly. In practice this can happen a lot because user code runs on the JS thread and React renders can also lock JS for a long time.

## A bit of history...

This project started about a year ago, when Expo built the li.st app on Android. [Krzysztof Magiera](https://twitter.com/kzzzf) was contracted to build the initial implementation on Android. It ended up working well and li.st was the first app to ship with native driven animations using Animated. A few months later, [Brandon Withrow](https://github.com/buba447) built the initial implementation on iOS. After that, [Ryan Gomba](https://twitter.com/ryangomba) and myself worked on adding missing features like support for `Animated.event` as well as squash bugs we found when using it in production apps. This was truly a community effort and I would like to thanks everyone that was involved as well as Expo for sponsoring a large part of the development. It is now used by `Touchable` components in React Native as well as for navigation animations in the newly released [React Navigation](https://github.com/react-community/react-navigation) library.

## How does it work?

First, let's check out how animations currently work using Animated with the JS driver. When using Animated, you declare a graph of nodes that represent the animations that you want to perform, and then use a driver to update an Animated value using a predefined curve. You may also update an Animated value by connecting it to an event of a `View` using `Animated.event`.

![](/react-native/blog/img/animated-diagram.png)

Here's a breakdown of the steps for an animation and where it happens:

- JS: The animation driver uses `requestAnimationFrame` to execute on every frame and update the value it drives using the new value it calculates based on the animation curve.
- JS: Intermediate values are calculated and passed to a props node that is attached to a `View`.
- JS: The `View` is updated using `setNativeProps`.
- JS to Native bridge.
- Native: The `UIView` or `android.View` is updated.

As you can see, most of the work happens on the JS thread. If it is blocked the animation will skip frames. It also needs to go through the JS to Native bridge on every frame to update native views.

What the native driver does is move all of these steps to native. Since Animated produces a graph of animated nodes, it can be serialized and sent to native only once when the animation starts, eliminating the need to callback into the JS thread; the native code can take care of updating the views directly on the UI thread on every frame.

Here's an example of how we can serialize an animated value and an interpolation node (not the exact implementation, just an example).

Create the native value node, this is the value that will be animated:
```
NativeAnimatedModule.createNode({
  id: 1,
  type: 'value',
  initialValue: 0,
});
```

Create the native interpolation node, this tells the native driver how to interpolate a value:
```
NativeAnimatedModule.createNode({
  id: 2,
  type: 'interpolation',
  inputRange: [0, 10],
  outputRange: [10, 0],
  extrapolate: 'clamp',
});
```

Create the native props node, this tells the native driver which prop on the view it is attached to:
```
NativeAnimatedModule.createNode({
  id: 3,
  type: 'props',
  properties: ['style.opacity'],
});
```

Connect nodes together:
```
NativeAnimatedModule.connectNodes(1, 2);
NativeAnimatedModule.connectNodes(2, 3);
```

Connect the props node to a view:
```
NativeAnimatedModule.connectToView(3, ReactNative.findNodeHandle(viewRef));
```

With that, the native animated module has all the info it needs to update the native views directly without having to go to JS to calculate any value.

All there is left to do is actually start the animation by specifying what type of animation curve we want and what animated value to update. Timing animations can also be simplified by calculating every frame of the animation in advance in JS to make the native implementation smaller.
```
NativeAnimatedModule.startAnimation({
  type: 'timing',
  frames: [0, 0.1, 0.2, 0.4, 0.65, ...],
  animatedValueId: 1,
});
```

And now here's the breakdown of what happens when the animation runs:

- Native: The native animation driver uses `CADisplayLink` or `android.view.Choreographer` to execute on every frame and update the value it drives using the new value it calculates based on the animation curve.
- Native: Intermediate values are calculated and passed to a props node that is attached to a native view.
- Native: The `UIView` or `android.View` is updated.

As you can see, no more JS thread and no more bridge which means faster animations! 🎉🎉

## How do I use this in my app?

For normal animations the answer is simple, just add `useNativeDriver: true` to the animation config when starting it.

Before:
```
Animated.timing(this.state.animatedValue, {
  toValue: 1,
  duration: 500,
}).start();
```
After:
```
Animated.timing(this.state.animatedValue, {
  toValue: 1,
  duration: 500,
  useNativeDriver: true, // <-- Add this
}).start();
```

Animated values are only compatible with one driver so if you use native driver when starting an animation on a value, make sure every animation on that value also uses the native driver.

It also works with `Animated.event`, this is very useful if you have an animation that must follow the scroll position because without the native driver it will always run a frame behind of the gesture because of the async nature of React Native.

Before:
```
<ScrollView
  scrollEventThrottle={16}
  onScroll={Animated.event(
    [{ nativeEvent: { contentOffset: { y: this.state.animatedValue } } }]
  )}
>
  {content}
</ScrollView>
```
After:
```
<Animated.ScrollView // <-- Use the Animated ScrollView wrapper
  scrollEventThrottle={1} // <-- Use 1 here to make sure no events are ever missed
  onScroll={Animated.event(
    [{ nativeEvent: { contentOffset: { y: this.state.animatedValue } } }],
    { useNativeDriver: true } // <-- Add this
  )}
>
  {content}
</Animated.ScrollView>
```

## Caveats

Not everything you can do with Animated is currently supported in Native Animated. The main limitation is that you can only animate non-layout properties, things like `transform`, `opacity` and `backgroundColor` will work but flexbox and position properties won't. Another one is with `Animated.event`, it will only work with direct events and not bubbling events. This means it does not work with `PanResponder` but does work with things like `ScrollView#onScroll`.

Native Animated has also been part of React Native for quite a while but has never been documented because it was considered experimental. Because of that make sure you are using a recent version (0.40+) of React Native if you want to use this feature.

## Resources

For more information about animated I recommend watching [this talk](https://www.youtube.com/watch?v=xtqUJVqpKNo) by [Christopher Chedeau](https://twitter.com/Vjeux).

If you want a deep dive into animations and how offloading them to native can improve user experience there is also [this talk](https://www.youtube.com/watch?v=qgSMjYWqBk4) by [Krzysztof Magiera](https://twitter.com/kzzzf).
