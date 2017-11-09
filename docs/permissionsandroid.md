---
id: permissionsandroid
title: PermissionsAndroid
layout: docs
category: APIs
permalink: docs/permissionsandroid.html
next: pixelratio
previous: panresponder
---

<div class="banner-crna-ejected">
  <h3>Project with Native Code Required</h3>
  <p>
    This API only works in projects made with <code>react-native init</code>
    or in those made with Create React Native App which have since ejected. For
    more information about ejecting, please see
    the <a href="https://github.com/react-community/create-react-native-app/blob/master/EJECTING.md" target="_blank">guide</a> on
    the Create React Native App repository.
  </p>
</div>

`PermissionsAndroid` provides access to Android M's new permissions model. Some permissions are granted by default when the application is installed so long as they appear in `AndroidManifest.xml`. However, "dangerous" permissions require a dialog prompt. You should use this module for those
permissions.

On devices before SDK version 23, the permissions are automatically granted if they appear in the manifest, so `check` and `request` should always be true.

If a user has previously turned off a permission that you prompt for, the OS will advise your app to show a rationale for needing the permission. The optional `rationale` argument will show a dialog prompt only if necessary - otherwise the normal permission prompt will appear.

### Example

```javascript
import { PermissionsAndroid } from 'react-native';

async function requestCameraPermission() {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        'title': 'Cool Photo App Camera Permission',
        'message': 'Cool Photo App needs access to your camera ' +
                   'so you can take awesome pictures.'
      }
    )
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log("You can use the camera")
    } else {
      console.log("Camera permission denied")
    }
  } catch (err) {
    console.warn(err)
  }
}
```


### Methods

- [`constructor`](docs/permissionsandroid.html#constructor)
- [`check`](docs/permissionsandroid.html#check)
- [`request`](docs/permissionsandroid.html#request)
- [`requestMultiple`](docs/permissionsandroid.html#requestmultiple)
- [`requestPermission`](docs/permissionsandroid.html#requestpermission)
- [`checkPermission`](docs/permissionsandroid.html#checkpermission)




---

# Reference

## Methods

### `constructor()`

```javascript
constructor()
```



---

### `check()`

```javascript
check(permission)
```


Returns a promise resolving to a boolean value as to whether the specified permissions has been granted


---

### `request()`

```javascript
request(permission, rationale?)
```


Prompts the user to enable a permission and returns a promise resolving to a string value indicating whether the user allowed or denied the request.

If the optional rationale argument is included (which is an object with a `title` and `message`), this function checks with the OS whether it is necessary to show a dialog [explaining why the permission is needed](https://developer.android.com/training/permissions/requesting.html#explain) and then shows the system permission dialog




---

### `requestMultiple()`

```javascript
requestMultiple(permissions)
```


Prompts the user to enable multiple permissions in the same dialog and returns an object with the permissions as keys and strings as values indicating whether the user allowed or denied the request


---

### `checkPermission()`

```javascript
checkPermission(permission)
```


**DEPRECATED** - use [check](docs/permissionsandroid.html#check)

Returns a promise resolving to a boolean value as to whether the specified permissions has been granted



---

### `requestPermission()`

```javascript
requestPermission(permission, rationale?)
```


**DEPRECATED** - use [request](docs/permissionsandroid.html#request)

Prompts the user to enable a permission and returns a promise resolving to a boolean value indicating whether the user allowed or denied the request.

If the optional rationale argument is included (which is an object with a `title` and `message`), this function checks with the OS whether it is necessary to show a dialog [explaining why the permission is needed](https://developer.android.com/training/permissions/requesting.html#explain) and then shows the system permission dialog

