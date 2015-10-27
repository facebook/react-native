---
id: native-modules-android
title: Native Modules
layout: docs
category: Guides (Android)
permalink: docs/native-modules-android.html
next: native-components-android
---

Sometimes an app needs access to a platform API that React Native doesn't have a corresponding module for yet. Maybe you want to reuse some existing Java code without having to reimplement it in JavaScript, or write some high performance, multi-threaded code such as for image processing, a database, or any number of advanced extensions.

We designed React Native such that it is possible for you to write real native code and have access to the full power of the platform. This is a more advanced feature and we don't expect it to be part of the usual development process, however it is essential that it exists. If React Native doesn't support a native feature that you need, you should be able to build it yourself.

## The Toast Module

This guide will use the [Toast](http://developer.android.com/reference/android/widget/Toast.html) example. Let's say we would like to be able to create a toast message from JavaScript.

We start by creating a native module. A native module is a Java class that usually extends the `ReactContextBaseJavaModule` class and implements the functionality required by the JavaScript. Our goal here is to be able to write `ToastAndroid.show('Awesome', ToastAndroid.SHORT);` from JavaScript to display a short toast on the screen.

```java
package com.facebook.react.modules.toast;

import android.widget.Toast;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import java.util.Map;

public class ToastModule extends ReactContextBaseJavaModule {

  private static final String DURATION_SHORT_KEY = "SHORT";
  private static final String DURATION_LONG_KEY = "LONG";

  public ToastModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }
}
```

`ReactContextBaseJavaModule` requires that a method called `getName` is implemented. The purpose of this method is to return the string name of the `NativeModule` which represents this class in JavaScript. So here we will call this `ToastAndroid` so that we can access it through `React.NativeModules.ToastAndroid` in JavaScript.

```java
  @Override
  public String getName() {
    return "ToastAndroid";
  }
```

An optional method called `getConstants` returns the constant values exposed to JavaScript. Its implementation is not required but is very useful to key pre-defined values that need to be communicated from JavaScript to Java in sync.

```java
  @Override
  public Map<String, Object> getConstants() {
    final Map<String, Object> constants = new HashMap<>();
    constants.put(DURATION_SHORT_KEY, Toast.LENGTH_SHORT);
    constants.put(DURATION_LONG_KEY, Toast.LENGTH_LONG);
    return constants;
  }
```

To expose a method to JavaScript a Java method must be annotated using `@ReactMethod`. The return type of bridge methods is always `void`. React Native bridge is asynchronous, so the only way to pass a result to JavaScript is by using callbacks or emitting events (see below).

```java
  @ReactMethod
  public void show(String message, int duration) {
    Toast.makeText(getReactApplicationContext(), message, duration).show();
  }
```

### Argument Types

The following argument types are supported for methods annotated with `@ReactMethod` and they directly map to their JavaScript equivalents

```
Boolean -> Bool
Integer -> Number
Double -> Number
Float -> Number
String -> String
Callback -> function
ReadableMap -> Object
ReadableArray -> Array
```

### Register the Module

The last step within Java is to register the Module; this happens in the `createNativeModules` of your apps package. If a module is not registered it will not be available from JavaScript.

```java
class AnExampleReactPackage implements ReactPackage {

  ...

  @Override
  public List<NativeModule> createNativeModules(
                              ReactApplicationContext reactContext) {
    List<NativeModule> modules = new ArrayList<>();

    modules.add(new ToastModule(reactContext));

    return modules;
  }
```

The package needs to be provided to the **ReactInstanceManager** when it is built. To accomplish this you will need to insert an `.addPackage(new YourPackageName())` call to the `mReactInstanceManager = ReactInstanceManager.builder()` call chain.

Refer to the code below and add the `addPackage` statement to your application's `MainActivity.java` file. This file exists under the android folder in your react-native application directory. The path to this file is: `android/app/src/main/java/com/your-app-name/MainActivity.java`.


```java
mReactInstanceManager = ReactInstanceManager.builder()
  .setApplication(getApplication())
  .setBundleAssetName("AnExampleApp.android.bundle")
  .setJSMainModuleName("Examples/AnExampleApp/AnExampleApp.android")
  .addPackage(new AnExampleReactPackage())  // <-- Add this line with your package name.
  .setUseDeveloperSupport(true)
  .setInitialLifecycleState(LifecycleState.RESUMED)
  .build();
```

To make it simpler to access your new functionality from JavaScript, it is common to wrap the native module in a JavaScript module. This is not necessary but saves the consumers of your library the need to pull it off of `NativeModules` each time. This JavaScript file also becomes a good location for you to add any JavaScript side functionality.

```java
/**
 * @providesModule ToastAndroid
 */

'use strict';

/**
 * This exposes the native ToastAndroid module as a JS module. This has a function 'show'
 * which takes the following parameters:
 *
 * 1. String message: A string with the text to toast
 * 2. int duration: The duration of the toast. May be ToastAndroid.SHORT or ToastAndroid.LONG
 */
var { NativeModules } = require('react-native');
module.exports = NativeModules.ToastAndroid;
```

Now, from your JavaScript file you can call the method like this:

```js
var ToastAndroid = require('ToastAndroid')
ToastAndroid.show('Awesome', ToastAndroid.SHORT);

// Note: We require ToastAndroid without any relative filepath because
// of the @providesModule directive. Using @providesModule is optional.
```

## Beyond Toasts

### Callbacks

Native modules also support a special kind of argument - a callback. In most cases it is used to provide the function call result to JavaScript.

```java
public class UIManagerModule extends ReactContextBaseJavaModule {

...

  @ReactMethod
  public void measureLayout(
      int tag,
      int ancestorTag,
      Callback errorCallback,
      Callback successCallback) {
    try {
      measureLayout(tag, ancestorTag, mMeasureBuffer);
      float relativeX = PixelUtil.toDIPFromPixel(mMeasureBuffer[0]);
      float relativeY = PixelUtil.toDIPFromPixel(mMeasureBuffer[1]);
      float width = PixelUtil.toDIPFromPixel(mMeasureBuffer[2]);
      float height = PixelUtil.toDIPFromPixel(mMeasureBuffer[3]);
      successCallback.invoke(relativeX, relativeY, width, height);
    } catch (IllegalViewOperationException e) {
      errorCallback.invoke(e.getMessage());
    }
  }

...
```

This method would be accessed in JavaScript using:

```js
UIManager.measureLayout(
  100,
  100,
  (msg) => {
    console.log(msg);
  },
  (x, y, width, height) => {
    console.log(x + ':' + y + ':' + width + ':' + height);
  }
);
```

A native module is supposed to invoke its callback only once. It can, however, store the callback and invoke it later.

It is very important to highlight that the callback is not invoked immediately after the native function completes - remember that bridge communication is asynchronous, and this too is tied to the run loop.

### Threading

Native modules should not have any assumptions about what thread they are being called on, as the current assignment is subject to change in the future. If a blocking call is required, the heavy work should be dispatched to an internally managed worker thread, and any callbacks distributed from there.

### Sending Events to JavaScript

Native modules can signal events to JavaScript without being invoked directly. The easiest way to do this is to use the `RCTDeviceEventEmitter` which can be obtained from the `ReactContext` as in the code snippet below.

```java
...
private void sendEvent(ReactContext reactContext,
                       String eventName,
                       @Nullable WritableMap params) {
  reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
      .emit(eventName, params);
}
...
WritableMap params = Arguments.createMap();
...
sendEvent(reactContext, "keyboardWillShow", params);
```

JavaScript modules can then register to receive events by `addListenerOn` using the `Subscribable` mixin

```js
var { DeviceEventEmitter } = require('react-native');
...

var ScrollResponderMixin = {
  mixins: [Subscribable.Mixin],


  componentWillMount: function() {
    ...
    this.addListenerOn(DeviceEventEmitter,
                       'keyboardWillShow',
                       this.scrollResponderKeyboardWillShow);
    ...
  },
  scrollResponderKeyboardWillShow:function(e: Event) {
    this.keyboardWillOpenTo = e;
    this.props.onKeyboardWillShow && this.props.onKeyboardWillShow(e);
  },
```

You can also directly use the `DeviceEventEmitter` module to listen for events.

```js
...
componentWillMount: function() {
  DeviceEventEmitter.addListener('keyboardWillShow', function(e: Event) {
    // handle event.
  });
}
...
```