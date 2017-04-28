---
id: native-modules-android
title: Native Modules
layout: docs
category: Guides (Android)
permalink: docs/native-modules-android.html
banner: ejected
next: native-components-android
previous: communication-ios
---

Sometimes an app needs access to a platform API that React Native doesn't have a corresponding module for yet. Maybe you want to reuse some existing Java code without having to reimplement it in JavaScript, or write some high performance, multi-threaded code such as for image processing, a database, or any number of advanced extensions.

We designed React Native such that it is possible for you to write real native code and have access to the full power of the platform. This is a more advanced feature and we don't expect it to be part of the usual development process, however it is essential that it exists. If React Native doesn't support a native feature that you need, you should be able to build it yourself.

### Enable Gradle

If you plan to make changes in Java code, we recommend enabling [Gradle Daemon](https://docs.gradle.org/2.9/userguide/gradle_daemon.html) to speed up builds.

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

Read more about [ReadableMap](https://github.com/facebook/react-native/blob/master/ReactAndroid/src/main/java/com/facebook/react/bridge/ReadableMap.java) and [ReadableArray](https://github.com/facebook/react-native/blob/master/ReactAndroid/src/main/java/com/facebook/react/bridge/ReadableArray.java)

### Register the Module

The last step within Java is to register the Module; this happens in the `createNativeModules` of your apps package. If a module is not registered it will not be available from JavaScript.

```java
package com.facebook.react.modules.toast;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class AnExampleReactPackage implements ReactPackage {

  @Override
  public List<Class<? extends JavaScriptModule>> createJSModules() {
    return Collections.emptyList();
  }

  @Override
  public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
    return Collections.emptyList();
  }

  @Override
  public List<NativeModule> createNativeModules(
                              ReactApplicationContext reactContext) {
    List<NativeModule> modules = new ArrayList<>();

    modules.add(new ToastModule(reactContext));

    return modules;
  }

}
```

The package needs to be provided in the `getPackages` method of the `MainApplication.java` file. This file exists under the android folder in your react-native application directory. The path to this file is: `android/app/src/main/java/com/your-app-name/MainApplication.java`.

```java
protected List<ReactPackage> getPackages() {
    return Arrays.<ReactPackage>asList(
            new MainReactPackage(),
            new AnExampleReactPackage()); // <-- Add this line with your package name.
}
```

To make it simpler to access your new functionality from JavaScript, it is common to wrap the native module in a JavaScript module. This is not necessary but saves the consumers of your library the need to pull it off of `NativeModules` each time. This JavaScript file also becomes a good location for you to add any JavaScript side functionality.

```js
'use strict';
/**
 * This exposes the native ToastAndroid module as a JS module. This has a
 * function 'show' which takes the following parameters:
 *
 * 1. String message: A string with the text to toast
 * 2. int duration: The duration of the toast. May be ToastAndroid.SHORT or
 *    ToastAndroid.LONG
 */
import { NativeModules } from 'react-native';
module.exports = NativeModules.ToastAndroid;
```

Now, from your other JavaScript file you can call the method like this:

```js
import ToastAndroid from './ToastAndroid';

ToastAndroid.show('Awesome', ToastAndroid.SHORT);
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

### Promises

Native modules can also fulfill a promise, which can simplify your code, especially when using ES2016's `async/await` syntax. When the last parameter of a bridged native method is a `Promise`, its corresponding JS method will return a JS Promise object.

Refactoring the above code to use a promise instead of callbacks looks like this:

```java
import com.facebook.react.bridge.Promise;

public class UIManagerModule extends ReactContextBaseJavaModule {

...
  private static final String E_LAYOUT_ERROR = "E_LAYOUT_ERROR";
  @ReactMethod
  public void measureLayout(
      int tag,
      int ancestorTag,
      Promise promise) {
    try {
      measureLayout(tag, ancestorTag, mMeasureBuffer);

      WritableMap map = Arguments.createMap();

      map.putDouble("relativeX", PixelUtil.toDIPFromPixel(mMeasureBuffer[0]));
      map.putDouble("relativeY", PixelUtil.toDIPFromPixel(mMeasureBuffer[1]));
      map.putDouble("width", PixelUtil.toDIPFromPixel(mMeasureBuffer[2]));
      map.putDouble("height", PixelUtil.toDIPFromPixel(mMeasureBuffer[3]));

      promise.resolve(map);
    } catch (IllegalViewOperationException e) {
      promise.reject(E_LAYOUT_ERROR, e);
    }
  }

...
```

The JavaScript counterpart of this method returns a Promise. This means you can use the `await` keyword within an async function to call it and wait for its result:

```js
async function measureLayout() {
  try {
    var {
      relativeX,
      relativeY,
      width,
      height,
    } = await UIManager.measureLayout(100, 100);

    console.log(relativeX + ':' + relativeY + ':' + width + ':' + height);
  } catch (e) {
    console.error(e);
  }
}

measureLayout();
```

### Threading

Native modules should not have any assumptions about what thread they are being called on, as the current assignment is subject to change in the future. If a blocking call is required, the heavy work should be dispatched to an internally managed worker thread, and any callbacks distributed from there.

### Getting activity result from `startActivityForResult`

You'll need to listen to `onActivityResult` if you want to get results from an activity you started with `startActivityForResult`. To do this, you must extend `BaseActivityEventListener` or implement `ActivityEventListener`. The former is preferred as it is more resilient to API changes. Then, you need to register the listener in the module's constructor,

```java
reactContext.addActivityEventListener(mActivityResultListener);
```

Now you can listen to `onActivityResult` by implementing the following method:

```java
@Override
public void onActivityResult(
  final Activity activity,
  final int requestCode,
  final int resultCode,
  final Intent intent) {
  // Your logic here
}
```

We will implement a simple image picker to demonstrate this. The image picker will expose the method `pickImage` to JavaScript, which will return the path of the image when called.

```java
public class ImagePickerModule extends ReactContextBaseJavaModule {

  private static final int IMAGE_PICKER_REQUEST = 467081;
  private static final String E_ACTIVITY_DOES_NOT_EXIST = "E_ACTIVITY_DOES_NOT_EXIST";
  private static final String E_PICKER_CANCELLED = "E_PICKER_CANCELLED";
  private static final String E_FAILED_TO_SHOW_PICKER = "E_FAILED_TO_SHOW_PICKER";
  private static final String E_NO_IMAGE_DATA_FOUND = "E_NO_IMAGE_DATA_FOUND";

  private Promise mPickerPromise;

  private final ActivityEventListener mActivityEventListener = new BaseActivityEventListener() {

    @Override
    public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent intent) {
      if (requestCode == IMAGE_PICKER_REQUEST) {
        if (mPickerPromise != null) {
          if (resultCode == Activity.RESULT_CANCELED) {
            mPickerPromise.reject(E_PICKER_CANCELLED, "Image picker was cancelled");
          } else if (resultCode == Activity.RESULT_OK) {
            Uri uri = intent.getData();

            if (uri == null) {
              mPickerPromise.reject(E_NO_IMAGE_DATA_FOUND, "No image data found");
            } else {
              mPickerPromise.resolve(uri.toString());
            }
          }

          mPickerPromise = null;
        }
      }
    }
  };

  public ImagePickerModule(ReactApplicationContext reactContext) {
    super(reactContext);

    // Add the listener for `onActivityResult`
    reactContext.addActivityEventListener(mActivityEventListener);
  }

  @Override
  public String getName() {
    return "ImagePickerModule";
  }

  @ReactMethod
  public void pickImage(final Promise promise) {
    Activity currentActivity = getCurrentActivity();

    if (currentActivity == null) {
      promise.reject(E_ACTIVITY_DOES_NOT_EXIST, "Activity doesn't exist");
      return;
    }

    // Store the promise to resolve/reject when picker returns data
    mPickerPromise = promise;

    try {
      final Intent galleryIntent = new Intent(Intent.ACTION_PICK);

      galleryIntent.setType("image/*");

      final Intent chooserIntent = Intent.createChooser(galleryIntent, "Pick an image");

      currentActivity.startActivityForResult(chooserIntent, IMAGE_PICKER_REQUEST);
    } catch (Exception e) {
      mPickerPromise.reject(E_FAILED_TO_SHOW_PICKER, e);
      mPickerPromise = null;
    }
  }
}
```

### Listening to LifeCycle events

Listening to the activity's LifeCycle events such as `onResume`, `onPause` etc. is very similar to how we implemented `ActivityEventListener`. The module must implement `LifecycleEventListener`. Then, you need to register a listener in the module's constructor,

```java
reactContext.addLifecycleEventListener(this);
```

Now you can listen to the activity's LifeCycle events by implementing the following methods:

```java
@Override
public void onHostResume() {
    // Activity `onResume`
}

@Override
public void onHostPause() {
    // Activity `onPause`
}

@Override
public void onHostDestroy() {
    // Activity `onDestroy`
}
```
