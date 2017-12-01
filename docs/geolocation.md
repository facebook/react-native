---
id: geolocation
title: Geolocation
layout: docs
category: APIs
permalink: docs/geolocation.html
next: imageeditor
previous: easing
---

The Geolocation API extends the web spec:
https://developer.mozilla.org/en-US/docs/Web/API/Geolocation

As a browser polyfill, this API is available through the `navigator.geolocation`
global - you do not need to `import` it.

### Configuration and Permissions

<div class="banner-crna-ejected">
  <h3>Projects with Native Code Only</h3>
  <p>
    This section only applies to projects made with <code>react-native init</code>
    or to those made with Create React Native App which have since ejected. For
    more information about ejecting, please see
    the <a href="https://github.com/react-community/create-react-native-app/blob/master/EJECTING.md" target="_blank">guide</a> on
    the Create React Native App repository.
  </p>
</div>

#### iOS
You need to include the `NSLocationWhenInUseUsageDescription` key
in Info.plist to enable geolocation when using the app. Geolocation is
enabled by default when you create a project with `react-native init`.

In order to enable geolocation in the background, you need to include the
'NSLocationAlwaysUsageDescription' key in Info.plist and add location as
a background mode in the 'Capabilities' tab in Xcode.

#### Android
To request access to location, you need to add the following line to your
app's `AndroidManifest.xml`:

`<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />`

Android API >= 18 Positions will also contain a `mocked` boolean to indicate if position
was created from a mock provider.

<p>
  Android API >= 23 Requires an additional step to check for, and request
  the ACCESS_FINE_LOCATION permission using
  the <a href="https://facebook.github.io/react-native/docs/permissionsandroid.html" target="_blank">PermissionsAndroid API</a>.
  Failure to do so may result in a hard crash.
</p>


### Methods

- [`setRNConfiguration`](docs/geolocation.html#setrnconfiguration)
- [`requestAuthorization`](docs/geolocation.html#requestauthorization)
- [`getCurrentPosition`](docs/geolocation.html#getcurrentposition)
- [`watchPosition`](docs/geolocation.html#watchposition)
- [`clearWatch`](docs/geolocation.html#clearwatch)
- [`stopObserving`](docs/geolocation.html#stopobserving)




---

# Reference

## Methods

### `setRNConfiguration()`

```javascript
Geolocation.setRNConfiguration(config)
```


Sets configuration options that will be used in all location requests.

### Options

#### iOS

- `skipPermissionRequests` - defaults to `false`, if `true` you must request permissions
before using Geolocation APIs.





---

### `requestAuthorization()`

```javascript
Geolocation.requestAuthorization()
```


Request suitable Location permission based on the key configured on pList.
If NSLocationAlwaysUsageDescription is set, it will request Always authorization,
although if NSLocationWhenInUseUsageDescription is set, it will request InUse
authorization.




---

### `getCurrentPosition()`

```javascript
Geolocation.getCurrentPosition(geo_success, geo_error?, geo_options?)
```


Invokes the success callback once with the latest location info.  Supported
options: timeout (ms), maximumAge (ms), enableHighAccuracy (bool)
On Android, if the location is cached this can return almost immediately,
or it will request an update which might take a while.




---

### `watchPosition()`

```javascript
Geolocation.watchPosition(success, error?, options?)
```


Invokes the success callback whenever the location changes.  Supported
options: timeout (ms), maximumAge (ms), enableHighAccuracy (bool), distanceFilter(m), useSignificantChanges (bool)




---

### `clearWatch()`

```javascript
Geolocation.clearWatch(watchID)
```



---

### `stopObserving()`

```javascript
Geolocation.stopObserving()
```



