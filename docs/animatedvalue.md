---
id: animatedvalue
title: AnimatedValue
layout: docs
category: APIs
permalink: docs/animated.html
next: animatedvaluexy
previous: animated
---

Standard value for driving animations. One `Animated.Value` can drive multiple properties in a synchronized fashion, but can only be driven by one mechanism at a time. Using a new mechanism (e.g. starting a new animation, or calling `setValue`) will stop any previous ones.

Typically initialized with `new Animated.Value(0);`

### Methods

- [`setValue`](docs/animatedvalue.html#setvalue)
- [`setOffset`](docs/animatedvalue.html#setoffset)
- [`flattenOffset`](docs/animatedvalue.html#flattenoffset)
- [`extractOffset`](docs/animatedvalue.html#extractoffset)
- [`addListener`](docs/animatedvalue.html#addlistener)
- [`removeListener`](docs/animatedvalue.html#removelistener)
- [`removeAllListeners`](docs/animatedvalue.html#removealllisteners)
- [`stopAnimation`](docs/animatedvalue.html#stopanimation)
- [`resetAnimation`](docs/animatedvalue.html#resetanimation)
- [`interpolate`](docs/animatedvalue.html#interpolate)
- [`animate`](docs/animatedvalue.html#animate)
- [`stopTracking`](docs/animatedvalue.html#stoptracking)
- [`track`](docs/animatedvalue.html#track)

---

# Reference

## Methods

### `setValue()`

```javascript
setValue(value)
```

Directly set the value. This will stop any animations running on the value and update all the bound properties.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| value | number | Yes |  |

---

### `setOffset()`

```javascript
setOffset(offset)
```

Sets an offset that is applied on top of whatever value is set, whether via `setValue`, an animation, or `Animated.event`. Useful for compensating things like the start of a pan gesture.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| offset | number | Yes |  |

---

### `flattenOffset()`

```javascript
flattenOffset()
```

Merges the offset value into the base value and resets the offset to zero. The final output of the value is unchanged.

---

### `extractOffset()`

```javascript
extractOffset()
```

Sets the offset value to the base value, and resets the base value to zero. The final output of the value is unchanged.


---

### `addListener()`

```javascript
addListener(callback)
```

Adds an asynchronous listener to the value so you can observe updates from animations.  This is useful because there is no way to synchronously read the value because it might be driven natively.

Returns a string that serves as an identifier for the listener.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| callback | function | Yes | The callback function which will receive an object with a `value` key set to the new value. |

---

### `removeListener()`

```javascript
removeListener(id)
```

Unregister a listener. The `id` param shall match the identifier previously returned by `addListener()`. 

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| id | string | Yes | Id for the listener being removed. |

---

### `removeAllListeners()`

```javascript
removeAllListeners()
```

Remove all registered listeners.

---

### `stopAnimation()`

```javascript
stopAnimation([callback])
```

Stops any running animation or tracking. `callback` is invoked with the final value after stopping the animation, which is useful for updating state to match the animation position with layout.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| callback | function | No | A function that will receive the final value. |

---

### `resetAnimation()`

```javascript
resetAnimation([callback])
```

Stops any animation and resets the value to its original.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| callback | function | No | A function that will receive the original value. |

---

### `interpolate()`

```javascript
interpolate(config)
```

Interpolates the value before updating the property, e.g. mapping 0-1 to 0-10.

See `AnimatedInterpolation.js`

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| config | object | Yes |  |

The `config` object is composed of the following keys:

- `inputRange`: an array of numbers
- `outputRange`: an array of numbers or strings
- `easing` (optional): a function that returns a number, given an input number
- `extrapolate` (optional): a string such as 'extend', 'identity', or 'clamp'
- `extrapolateLeft` (optional): a string such as 'extend', 'identity', or 'clamp'
- `extrapolateRight` (optional): a string such as 'extend', 'identity', or 'clamp'

---

### `animate()`

```javascript
animate(animation, callback)
```

Typically only used internally, but could be used by a custom Animation class.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| animation | Animation | Yes | See `Animation.js` |
| callback | function | Yes |  |

---

### `stopTracking()`

```javascript
stopTracking()
```

Typically only used internally.

---

### `track()`

```javascript
track(tracking)
```

Typically only used internally.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| tracking | AnimatedNode | Yes | See `AnimatedNode.js` |
