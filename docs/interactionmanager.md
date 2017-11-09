---
id: interactionmanager
title: InteractionManager
layout: docs
category: APIs
permalink: docs/interactionmanager.html
next: keyboard
previous: imagestore
---

InteractionManager allows long-running work to be scheduled after any
interactions/animations have completed. In particular, this allows JavaScript
animations to run smoothly.

Applications can schedule tasks to run after interactions with the following:

```
InteractionManager.runAfterInteractions(() => {
  // ...long-running synchronous task...
});
```

Compare this to other scheduling alternatives:

- requestAnimationFrame(): for code that animates a view over time.
- setImmediate/setTimeout(): run code later, note this may delay animations.
- runAfterInteractions(): run code later, without delaying active animations.

The touch handling system considers one or more active touches to be an
'interaction' and will delay `runAfterInteractions()` callbacks until all
touches have ended or been cancelled.

InteractionManager also allows applications to register animations by
creating an interaction 'handle' on animation start, and clearing it upon
completion:

```
var handle = InteractionManager.createInteractionHandle();
// run animation... (`runAfterInteractions` tasks are queued)
// later, on animation completion:
InteractionManager.clearInteractionHandle(handle);
// queued tasks run if all handles were cleared
```

`runAfterInteractions` takes either a plain callback function, or a
`PromiseTask` object with a `gen` method that returns a `Promise`.  If a
`PromiseTask` is supplied, then it is fully resolved (including asynchronous
dependencies that also schedule more tasks via `runAfterInteractions`) before
starting on the next task that might have been queued up synchronously
earlier.

By default, queued tasks are executed together in a loop in one
`setImmediate` batch. If `setDeadline` is called with a positive number, then
tasks will only be executed until the deadline (in terms of js event loop run
time) approaches, at which point execution will yield via setTimeout,
allowing events such as touches to start interactions and block queued tasks
from executing, making apps more responsive.


### Methods

- [`runAfterInteractions`](docs/interactionmanager.html#runafterinteractions)
- [`createInteractionHandle`](docs/interactionmanager.html#createinteractionhandle)
- [`clearInteractionHandle`](docs/interactionmanager.html#clearinteractionhandle)
- [`setDeadline`](docs/interactionmanager.html#setdeadline)


### Properties

- [`Events`](docs/interactionmanager.html#events)
- [`addListener`](docs/interactionmanager.html#addlistener)




---

# Reference

## Methods

### `runAfterInteractions()`

```javascript
InteractionManager.runAfterInteractions(task)
```


Schedule a function to run after all interactions have completed. Returns a cancellable
"promise".




---

### `createInteractionHandle()`

```javascript
InteractionManager.createInteractionHandle()
```


Notify manager that an interaction has started.




---

### `clearInteractionHandle()`

```javascript
InteractionManager.clearInteractionHandle(handle)
```


Notify manager that an interaction has completed.




---

### `setDeadline()`

```javascript
InteractionManager.setDeadline(deadline)
```


A positive number will use setTimeout to schedule any tasks after the
eventLoopRunningTime hits the deadline value, otherwise all tasks will be
executed in one setImmediate batch (default).




## Properties



---



