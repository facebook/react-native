---
id: timers
title: Timers
layout: docs
category: Guides
permalink: docs/timers.html
next: activityindicatorios
---

Timers are an important part of an application and React Native implements the [browser timers](https://developer.mozilla.org/en-US/Add-ons/Code_snippets/Timers).

## Timers

- setTimeout, clearTimeout
- setInterval, clearInterval
- setImmediate, clearImmediate
- requestAnimationFrame, cancelAnimationFrame

`requestAnimationFrame(fn)` is the exact equivalent of `setTimeout(fn, 0)`, they are triggered right after the screen has been flushed.

`setImmediate` is executed at the end of the current JavaScript execution block, right before sending the batched response back to native. Note that if you call `setImmediate` within a `setImmediate` callback, it will be executed right away, it won't yield back to native in between.

The `Promise` implementation uses `setImmediate` its asynchronicity primitive.


## InteractionManager

One reason why native apps feel so good performance wise is that barely any work is being done during an interaction/animation. In React Native, you can use `InteractionManager` that allows long-running work to be scheduled after any interactions/animations have completed.

Applications can schedule tasks to run after interactions with the following:

```javascript
InteractionManager.runAfterInteractions(() => {
   // ...long-running synchronous task...
});
```

Compare this to other scheduling alternatives:

- requestAnimationFrame(): for code that animates a view over time.
- setImmediate/setTimeout/setInterval(): run code later, note this may delay animations.
- runAfterInteractions(): run code later, without delaying active animations.

The touch handling system considers one or more active touches to be an 'interaction' and will delay `runAfterInteractions()` callbacks until all touches have ended or been cancelled.

InteractionManager also allows applications to register animations by creating an interaction 'handle' on animation start, and clearing it upon completion:

```javascript
var handle = InteractionManager.createInteractionHandle();
// run animation... (`runAfterInteractions` tasks are queued)
// later, on animation completion:
InteractionManager.clearInteractionHandle(handle);
// queued tasks run if all handles were cleared
```


## TimerMixin

We found out that the primary cause of fatals in apps created with React Native was due to timers firing after a component was unmounted. To solve this recurring issue, we introduced `TimerMixin`. If you include `TimerMixin`, then you can replace your calls to `setTimeout(fn, 500)` with `this.setTimeout(fn, 500)` (just prepend `this.`) and everything will be properly cleaned up for you when the component unmounts.

```javascript
var { TimerMixin } = React;

var Component = React.createClass({
  mixins: [TimerMixin],
  componentDidMount: function() {
    this.setTimeout(
      () => { console.log('I do not leak!'); },
      500
    );
  }
});
```

We highly recommend never using bare timers and always using this mixin, it will save you from a lot of hard to track down bugs.
