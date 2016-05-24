---
id: platform-specific-code
title: Platform Specific Code
layout: docs
category: Guides
permalink: docs/platform-specific-code.html
next: native-modules-ios
---

When building a cross-platform app, the need to write different code for different platforms may arise. This can always be achieved by organizing the various components in different folders:

```sh
/common/components/
/android/components/
/ios/components/
```

Another option may be naming the components differently depending on the platform they are going to be used in:

```sh
BigButtonIOS.js
BigButtonAndroid.js
```

But React Native provides two alternatives to easily organize your code separating it by platform:

## Platform specific extensions
React Native will detect when a file has a `.ios.` or `.android.` extension and load the right file for each platform when requiring them from other components.

For example, you can have these files in your project:

```sh
BigButton.ios.js
BigButton.android.js
```

With this setup, you can just require the files from a different component without paying attention to the platform in which the app will run.

```javascript
import BigButton from './components/BigButton';
```

React Native will import the correct component for the running platform.

## Platform module
A module is provided by React Native to detect what is the platform in which the app is running. This piece of functionality can be useful when only small parts of a component are platform specific.

```javascript
var { Platform } = ReactNative;

var styles = StyleSheet.create({
  height: (Platform.OS === 'ios') ? 200 : 100,
});
```

`Platform.OS` will be `ios` when running in iOS and `android` when running in an Android device or simulator.

There is also a `Platform.select` method available, that given an object containing Platform.OS as keys,
returns the value for the platform you are currently running on.

```javascript
var { Platform } = ReactNative;

var styles = StyleSheet.create({
  container: {
    flex: 1,
    ...Platform.select({
      ios: {
        backgroundColor: 'red',
      },
      android: {
        backgroundColor: 'blue',
      },
    }),
  },
});
```

This will result in a container having `flex: 1` on both platforms and backgroundColor - red on iOS and blue
on Android.

Since it accepts `any` value, you can also use it to return platform specific component, like below:

```javascript
var Component = Platform.select({
  ios: () => require('ComponentIOS'),
  android: () => require('ComponentAndroid'),
})();

<Component />;
```

###Detecting Android version
On Android, the Platform module can be also used to detect which is the version of the Android Platform in which the app is running

```javascript
var {Platform} = ReactNative;

if(Platform.Version === 21){
  console.log('Running on Lollipop!');
}
```
