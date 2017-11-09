---
id: vibration
title: Vibration
layout: docs
category: APIs
permalink: docs/vibration.html
next: vibrationios
previous: toastandroid
---
The Vibration API is exposed at `Vibration.vibrate()`.
The vibration is asynchronous so this method will return immediately.

There will be no effect on devices that do not support Vibration, eg. the simulator.

**Note for Android:**
add `<uses-permission android:name="android.permission.VIBRATE"/>` to `AndroidManifest.xml`

Since the **vibration duration in iOS is not configurable**, so there are some differences with Android.
In Android, if `pattern` is a number, it specified the vibration duration in ms. If `pattern`
is an array, those odd indices is the vibration duration, while the even one are the separation time.

In iOS, invoking `vibrate(duration)` will just ignore the duration and vibrate for a fixed time. While the
`pattern` array is used to define the duration between each vibration. See below example for more.

Repeatable vibration is also supported, the vibration will repeat with defined pattern until `cancel()` is called.

Example:
```
const DURATION = 10000
const PATTERN = [1000, 2000, 3000]

Vibration.vibrate(DURATION)
// Android: vibrate for 10s
// iOS: duration is not configurable, vibrate for fixed time (about 500ms)

Vibration.vibrate(PATTERN)
// Android: wait 1s -> vibrate 2s -> wait 3s
// iOS: wait 1s -> vibrate -> wait 2s -> vibrate -> wait 3s -> vibrate

Vibration.vibrate(PATTERN, true)
// Android: wait 1s -> vibrate 2s -> wait 3s -> wait 1s -> vibrate 2s -> wait 3s -> ...
// iOS: wait 1s -> vibrate -> wait 2s -> vibrate -> wait 3s -> vibrate -> wait 1s -> vibrate -> wait 2s -> vibrate -> wait 3s -> vibrate -> ...

Vibration.cancel()
// Android: vibration stopped
// iOS: vibration stopped
```

### Methods

- [`vibrate`](docs/vibration.html#vibrate)
- [`cancel`](docs/vibration.html#cancel)




---

# Reference

## Methods

### `vibrate()`

```javascript
Vibration.vibrate(pattern: number, Array<number>, repeat: boolean)
```

Trigger a vibration with specified `pattern`.

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| pattern | number, Array<number> | Yes | Vibration pattern, accept a number or an array of number. Default to 400ms. |
| repeat | boolean | Yes | Optional. Repeat vibration pattern until cancel(), default to false. |




---

### `cancel()`

```javascript
Vibration.cancel()
```

Stop vibration.




