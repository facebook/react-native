---
id: systrace
title: Systrace
layout: docs
category: APIs
permalink: docs/systrace.html
next: timepickerandroid
previous: stylesheet
---



### Methods

- [`installReactHook`](docs/systrace.html#installreacthook)
- [`setEnabled`](docs/systrace.html#setenabled)
- [`isEnabled`](docs/systrace.html#isenabled)
- [`beginEvent`](docs/systrace.html#beginevent)
- [`endEvent`](docs/systrace.html#endevent)
- [`beginAsyncEvent`](docs/systrace.html#beginasyncevent)
- [`endAsyncEvent`](docs/systrace.html#endasyncevent)
- [`counterEvent`](docs/systrace.html#counterevent)
- [`attachToRelayProfiler`](docs/systrace.html#attachtorelayprofiler)
- [`swizzleJSON`](docs/systrace.html#swizzlejson)
- [`measureMethods`](docs/systrace.html#measuremethods)
- [`measure`](docs/systrace.html#measure)




---

# Reference

## Methods

### `installReactHook()`

```javascript
static installReactHook(useFiber)
```



---

### `setEnabled()`

```javascript
static setEnabled(enabled)
```



---

### `isEnabled()`

```javascript
static isEnabled()
```



---

### `beginEvent()`

```javascript
static beginEvent(profileName?, args?)
```


beginEvent/endEvent for starting and then ending a profile within the same call stack frame




---

### `endEvent()`

```javascript
static endEvent()
```



---

### `beginAsyncEvent()`

```javascript
static beginAsyncEvent(profileName?)
```


beginAsyncEvent/endAsyncEvent for starting and then ending a profile where the end can either
occur on another thread or out of the current stack frame, eg await
the returned cookie variable should be used as input into the endAsyncEvent call to end the profile




---

### `endAsyncEvent()`

```javascript
static endAsyncEvent(profileName?, cookie?)
```



---

### `counterEvent()`

```javascript
static counterEvent(profileName?, value?)
```


counterEvent registers the value to the profileName on the systrace timeline




---

### `attachToRelayProfiler()`

```javascript
static attachToRelayProfiler(relayProfiler)
```


Relay profiles use await calls, so likely occur out of current stack frame
therefore async variant of profiling is used




---

### `swizzleJSON()`

```javascript
static swizzleJSON()
```

This is not called by default due to perf overhead but it's useful
if you want to find traces which spend too much time in JSON.



---

### `measureMethods()`

```javascript
static measureMethods(object, objectName, methodNames)
```


Measures multiple methods of a class. For example, you can do:

```javascript
Systrace.measureMethods(JSON, 'JSON', ['parse', 'stringify']);
```

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| object | any | Yes | | 
| objectName | string | Yes | |
| methodNames | array | Yes| Map from method names to method display names. |



---

### `measure()`

```javascript
static measure(objName, fnName, func)
```


Returns an profiled version of the input function. For example, you can:

```javascript
JSON.parse = Systrace.measure('JSON', 'parse', JSON.parse);
```

**Parameters:**

| Name | Type | Required | Description |
| - | - | - | - |
| objName | string | Yes | | 
| fnName | string | Yes | |
| func | function | Yes | |





