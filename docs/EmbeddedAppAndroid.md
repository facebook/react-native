---
id: embedded-app-android
title: Integrating with Existing Apps
layout: docs
category: Guides (Android)
permalink: docs/embedded-app-android.html
next: signed-apk-android
---

Since React makes no assumptions about the rest of your technology stack, it's easily embeddable within an existing non-React Native app.

## Requirements

* an existing, gradle-based Android app
* Node.js, see Getting Started for setup instructions

## Prepare your app

In your app's `build.gradle` file add the React Native dependency:

    compile 'com.facebook.react:react-native:0.20.+'

You can find the latest version of the react-native library on [Maven Central](http://search.maven.org/#search%7Cgav%7C1%7Cg%3A%22com.facebook.react%22%20AND%20a%3A%22react-native%22). Next, make sure you have the Internet permission in your `AndroidManifest.xml`:

    <uses-permission android:name="android.permission.INTERNET" />

This is only really used in dev mode when reloading JavaScript from the development server, so you can strip this in release builds if you need to.

## Add native code

You need to add some native code in order to start the React Native runtime and get it to render something. To do this, we're going to create an `Activity` that creates a `ReactRootView`, starts a React application inside it and sets it as the main content view.

```java
public class MyReactActivity extends Activity implements DefaultHardwareBackBtnHandler {
    private ReactRootView mReactRootView;
    private ReactInstanceManager mReactInstanceManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        mReactRootView = new ReactRootView(this);
        mReactInstanceManager = ReactInstanceManager.builder()
                .setApplication(getApplication())
                .setBundleAssetName("index.android.bundle")
                .setJSMainModuleName("index.android")
                .addPackage(new MainReactPackage())
                .setUseDeveloperSupport(BuildConfig.DEBUG)
                .setInitialLifecycleState(LifecycleState.RESUMED)
                .build();
        mReactRootView.startReactApplication(mReactInstanceManager, "MyAwesomeApp", null);

        setContentView(mReactRootView);
    }

    @Override
    public void invokeDefaultOnBackPressed() {
        super.onBackPressed();
    }
}
```

Next, we need to pass some activity lifecycle callbacks down to the `ReactInstanceManager`:

```java
@Override
protected void onPause() {
    super.onPause();

    if (mReactInstanceManager != null) {
        mReactInstanceManager.onPause();
    }
}

@Override
protected void onResume() {
    super.onResume();

    if (mReactInstanceManager != null) {
        mReactInstanceManager.onResume(this, this);
    }
}
```

We also need to pass back button events to React Native:

```java
@Override
 public void onBackPressed() {
    if (mReactInstanceManager != null) {
        mReactInstanceManager.onBackPressed();
    } else {
        super.onBackPressed();
    }
}
```

 This allows JavaScript to control what happens when the user presses the hardware back button (e.g. to implement navigation). When JavaScript doesn't handle a back press, your `invokeDefaultOnBackPressed` method will be called. By default this simply finishes your `Activity`.
Finally, we need to hook up the dev menu. By default, this is activated by (rage) shaking the device, but this is not very useful in emulators. So we make it show when you press the hardware menu button:

```java
@Override
public boolean onKeyUp(int keyCode, KeyEvent event) {
    if (keyCode == KeyEvent.KEYCODE_MENU && mReactInstanceManager != null) {
        mReactInstanceManager.showDevOptionsDialog();
        return true;
    }
    return super.onKeyUp(keyCode, event);
}
```

That's it, your activity is ready to run some JavaScript code.

## Add JS to your app

In your project's root folder, run:

    $ npm init
    $ npm install --save react-native
    $ curl -o .flowconfig https://raw.githubusercontent.com/facebook/react-native/master/.flowconfig

This creates a node module for your app and adds the `react-native` npm dependency. Now open the newly created `package.json` file and add this under `scripts`:

    "start": "node_modules/react-native/packager/packager.sh"

Copy & paste the following code to `index.android.js` in your root folder — it's a barebones React Native app:

```js
'use strict';

import React, {
  Text,
  View
} from 'react-native';

class MyAwesomeApp extends React.Component {
  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.hello}>Hello, World</Text>
      </View>
    )
  }
}
var styles = React.StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  hello: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
});

React.AppRegistry.registerComponent('MyAwesomeApp', () => MyAwesomeApp);
```

## Run your app

To run your app, you need to first start the development server. To do this, simply run the following command in your root folder:

    $ npm start

Now build and run your Android app as normal (e.g. `./gradlew installDebug`). Once you reach your React-powered activity inside the app, it should load the JavaScript code from the development server and display:

![Screenshot](img/EmbeddedAppAndroid.png)

## Sharing a ReactInstance across multiple Activities / Fragments in your app

You can have multiple Activities or Fragments that use the same `ReactInstanceManager`. You'll want to make your own "ReactFragment" or "ReactActivity" and have a singleton "holder" that holds a `ReactInstanceManager`. When you need the `ReactInstanceManager` / hook up the `ReactInstanceManager` to the lifecycle of those Activities or Fragments, use the one provided by the singleton.
