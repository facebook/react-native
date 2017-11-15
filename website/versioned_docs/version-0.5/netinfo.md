---
id: version-0.5-netinfo
title: NetInfo
original_id: netinfo
---

NetInfo exposes info about online/offline status.

```
NetInfo.getConnectionInfo().then((connectionInfo) => {
  console.log('Initial, type: ' + connectionInfo.type + ', effectiveType: ' + connectionInfo.effectiveType);
});
function handleFirstConnectivityChange(connectionInfo) {
  console.log('First change, type: ' + connectionInfo.type + ', effectiveType: ' + connectionInfo.effectiveType);
  NetInfo.removeEventListener(
    'connectionChange',
    handleFirstConnectivityChange
  );
}
NetInfo.addEventListener(
  'connectionChange',
  handleFirstConnectivityChange
);
```

### ConnectionType enum

`ConnectionType` describes the type of connection the device is using to communicate with the network.

Cross platform values for `ConnectionType`:
- `none` - device is offline
- `wifi` - device is online and connected via wifi, or is the iOS simulator
- `cellular` - device is connected via Edge, 3G, WiMax, or LTE
- `unknown` - error case and the network status is unknown

Android-only values for `ConnectionType`:
- `bluetooth` - device is connected via Bluetooth
- `ethernet` - device is connected via Ethernet
- `wimax` - device is connected via WiMAX

### EffectiveConnectionType enum

Cross platform values for `EffectiveConnectionType`:
- `2g`
- `3g`
- `4g`
- `unknown`

### Android

To request network info, you need to add the following line to your
app's `AndroidManifest.xml`:

`<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />`

### Connectivity Types (deprecated)

The following connectivity types are deprecated. They're used by the deprecated APIs `fetch` and the `change` event.

iOS connectivity types (deprecated):
- `none` - device is offline
- `wifi` - device is online and connected via wifi, or is the iOS simulator
- `cell` - device is connected via Edge, 3G, WiMax, or LTE
- `unknown` - error case and the network status is unknown

Android connectivity types (deprecated).
- `NONE` - device is offline
- `BLUETOOTH` - The Bluetooth data connection.
- `DUMMY` -  Dummy data connection.
- `ETHERNET` - The Ethernet data connection.
- `MOBILE` - The Mobile data connection.
- `MOBILE_DUN` - A DUN-specific Mobile data connection.
- `MOBILE_HIPRI` - A High Priority Mobile data connection.
- `MOBILE_MMS` - An MMS-specific Mobile data connection.
- `MOBILE_SUPL` -  A SUPL-specific Mobile data connection.
- `VPN` -  A virtual network using one or more native bearers. Requires API Level 21
- `WIFI` - The WIFI data connection.
- `WIMAX` -  The WiMAX data connection.
- `UNKNOWN` - Unknown data connection.

The rest of the connectivity types are hidden by the Android API, but can be used if necessary.


### Methods

- [`addEventListener`](docs/netinfo.html#addeventlistener)
- [`removeEventListener`](docs/netinfo.html#removeeventlistener)
- [`fetch`](docs/netinfo.html#fetch)
- [`getConnectionInfo`](docs/netinfo.html#getconnectioninfo)
- [`isConnectionExpensive`](docs/netinfo.html#isconnectionexpensive)


### Properties

- [`isConnected`](docs/netinfo.html#isconnected)




---

# Reference

## Methods

### `addEventListener()`

```javascript
NetInfo.addEventListener(eventName, handler)
```


Adds an event handler. Supported events:

- `connectionChange`: Fires when the network status changes. The argument to the event
  handler is an object with keys:
  - `type`: A `ConnectionType` (listed above)
  - `effectiveType`: An `EffectiveConnectionType` (listed above)
- `change`: This event is deprecated. Listen to `connectionChange` instead. Fires when
  the network status changes. The argument to the event handler is one of the deprecated
  connectivity types listed above.




---

### `removeEventListener()`

```javascript
NetInfo.removeEventListener(eventName, handler)
```


Removes the listener for network status changes.




---

### `fetch()`

```javascript
NetInfo.fetch()
```


This function is deprecated. Use `getConnectionInfo` instead. Returns a promise that
resolves with one of the deprecated connectivity types listed above.




---

### `getConnectionInfo()`

```javascript
NetInfo.getConnectionInfo()
```


Returns a promise that resolves to an object with `type` and `effectiveType` keys
whose values are a `ConnectionType` and an `EffectiveConnectionType`, (described above),
respectively.




---

### `isConnectionExpensive()`

```javascript
NetInfo.isConnectionExpensive()
```

Available on Android. Detect if the current active connection is metered or not. A network is
classified as metered when the user is sensitive to heavy data usage on that connection due to
monetary costs, data limitations or battery/performance issues.

```
NetInfo.isConnectionExpensive()
.then(isConnectionExpensive => {
  console.log('Connection is ' + (isConnectionExpensive ? 'Expensive' : 'Not Expensive'));
})
.catch(error => {
  console.error(error);
});
```



## Properties

### `isConnected`

Available on all platforms. Asynchronously fetch a boolean to determine internet connectivity.

```
NetInfo.isConnected.fetch().then(isConnected => {
  console.log('First, is ' + (isConnected ? 'online' : 'offline'));
});
function handleFirstConnectivityChange(isConnected) {
  console.log('Then, is ' + (isConnected ? 'online' : 'offline'));
  NetInfo.isConnected.removeEventListener(
    'connectionChange',
    handleFirstConnectivityChange
  );
}
NetInfo.isConnected.addEventListener(
  'connectionChange',
  handleFirstConnectivityChange
);
```
