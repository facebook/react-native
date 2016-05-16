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

    compile 'com.facebook.react:react-native:+'

and add React Native local Maven repository from npm modules.

    repositories {
        maven {
            url "<path-to-node_modules>/react-native/android"
        }
    }

Next, make sure you have the Internet permission in your `AndroidManifest.xml`:

    <uses-permission android:name="android.permission.INTERNET" />

This is only really used in dev mode when reloading JavaScript from the development server, so you can strip this in release builds if you need to.


## Add native code

You need to add some native code in order to start the React Native runtime and get it to render something. To do this, we're going to create an `Activity` that extends `ReactActivity`.

```java
public class MyReactActivity extends ReactActivity {
  /**
   * Returns the name of the main component registered from JavaScript.
   * This is used to schedule rendering of the component.
   */
  @Override
  protected String getMainComponentName() {
      return "MyAwesomeApp";
  }

  /**
   * Returns whether dev mode should be enabled.
   * This enables e.g. the dev menu.
   */
  @Override
  protected boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
  }

  /**
   * A list of packages used by the app. If the app uses additional views
   * or modules besides the default ones, add more packages here.
   */
  @Override
  protected List<ReactPackage> getPackages() {
    return Arrays.<ReactPackage>asList(
      new MainReactPackage()
    );
  }
}
```

That's it, your activity is ready to run some JavaScript code.

## Add JS to your app

In your project's root folder, run:

    $ npm init
    $ npm install --save react-native
    $ curl -o .flowconfig https://raw.githubusercontent.com/facebook/react-native/master/.flowconfig

This creates a node module for your app and adds the `react-native` npm dependency. Now open the newly created `package.json` file and add this under `scripts`:

    "start": "node node_modules/react-native/local-cli/cli.js start"

Copy & paste the following code to `index.android.js` in your root folder — it's a barebones React Native app:

```js
'use strict';

import React from 'react';
import {
  AppRegistry,
  StyleSheet,
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
var styles = StyleSheet.create({
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

AppRegistry.registerComponent('MyAwesomeApp', () => MyAwesomeApp);
```

## Run your app

To run your app, you need to first start the development server. To do this, simply run the following command in your root folder:

    $ npm start

Now build and run your Android app as normal (e.g. `./gradlew installDebug`). Once you reach your React-powered activity inside the app, it should load the JavaScript code from the development server and display:

![Screenshot](img/EmbeddedAppAndroid.png)
