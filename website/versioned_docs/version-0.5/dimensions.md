---
id: version-0.5-dimensions
title: Dimensions
original_id: dimensions
---



### Methods

- [`set`](docs/dimensions.html#set)
- [`get`](docs/dimensions.html#get)
- [`addEventListener`](docs/dimensions.html#addeventlistener)
- [`removeEventListener`](docs/dimensions.html#removeeventlistener)




---

# Reference

## Methods

### `set()`

```javascript
Dimensions.set(dims)
```


This should only be called from native code by sending the
didUpdateDimensions event.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| dims | object | Yes | Simple string-keyed object of dimensions to set |




---

### `get()`

```javascript
Dimensions.get(dim)
```


Initial dimensions are set before `runApplication` is called so they should
be available before any other require's are run, but may be updated later.

> Note:
> Although dimensions are available immediately, they may change (e.g due to device rotation) so any rendering logic or styles that depend on these constants should try to call this function on every render, rather than caching the value (for example, using inline styles rather than setting a value in a `StyleSheet`).

Example: `var {height, width} = Dimensions.get('window');`

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| dim | string | Yes | Name of dimension as defined when calling `set`. |





---

### `addEventListener()`

```javascript
Dimensions.addEventListener(type, handler)
```


Add an event handler. Supported events:

- `change`: Fires when a property within the `Dimensions` object changes. The argument
  to the event handler is an object with `window` and `screen` properties whose values
  are the same as the return values of `Dimensions.get('window')` and
  `Dimensions.get('screen')`, respectively.




---

### `removeEventListener()`

```javascript
Dimensions.removeEventListener(type, handler)
```


Remove an event handler.




