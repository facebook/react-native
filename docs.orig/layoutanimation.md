---
id: layoutanimation
title: LayoutAnimation
---

Automatically animates views to their new positions when the
next layout happens.

A common way to use this API is to call it before calling `setState`.

Note that in order to get this to work on **Android** you need to set the following flags via `UIManager`:

    UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);


### Methods

- [`configureNext`](docs/layoutanimation.html#configurenext)
- [`create`](docs/layoutanimation.html#create)
- [`checkConfig`](docs/layoutanimation.html#checkconfig)


### Properties

- [`Types`](docs/layoutanimation.html#types)
- [`Properties`](docs/layoutanimation.html#properties)
- [`Presets`](docs/layoutanimation.html#presets)
- [`easeInEaseOut`](docs/layoutanimation.html#easeineaseout)
- [`linear`](docs/layoutanimation.html#linear)
- [`spring`](docs/layoutanimation.html#spring)




---

# Reference

## Methods

### `configureNext()`

```javascript
LayoutAnimation.configureNext(config, onAnimationDidEnd?)
```


Schedules an animation to happen on the next layout.

@param config Specifies animation properties:

  - `duration` in milliseconds
  - `create`, config for animating in new views (see `Anim` type)
  - `update`, config for animating views that have been updated
(see `Anim` type)

@param onAnimationDidEnd Called when the animation finished.
Only supported on iOS.
@param onError Called on error. Only supported on iOS.




---

### `create()`

```javascript
LayoutAnimation.create(duration, type, creationProp)
```


Helper for creating a config for `configureNext`.




---

### `checkConfig()`

```javascript
LayoutAnimation.checkConfig(config, location, name)
```



## Properties



---



---



---



---



---



