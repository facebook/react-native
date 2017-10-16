/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule NetInfo
 * @flow
 */
'use strict';

const Map = require('Map');
const NativeEventEmitter = require('NativeEventEmitter');
const NativeModules = require('NativeModules');
const Platform = require('Platform');
const RCTNetInfo = NativeModules.NetInfo;

const NetInfoEventEmitter = new NativeEventEmitter(RCTNetInfo);

const DEVICE_CONNECTIVITY_EVENT = 'networkStatusDidChange';

type ChangeEventName = $Enum<{
  connectionChange: string,
  change: string,
}>;

type ReachabilityStateIOS = $Enum<{
  cell: string,
  none: string,
  unknown: string,
  wifi: string,
}>;

type ConnectivityStateAndroid = $Enum<{
  NONE: string,
  MOBILE: string,
  WIFI: string,
  MOBILE_MMS: string,
  MOBILE_SUPL: string,
  MOBILE_DUN: string,
  MOBILE_HIPRI: string,
  WIMAX: string,
  BLUETOOTH: string,
  DUMMY: string,
  ETHERNET: string,
  MOBILE_FOTA: string,
  MOBILE_IMS: string,
  MOBILE_CBS: string,
  WIFI_P2P: string,
  MOBILE_IA: string,
  MOBILE_EMERGENCY: string,
  PROXY: string,
  VPN: string,
  UNKNOWN: string,
}>;


const _subscriptions = new Map();

let _isConnectedDeprecated;
if (Platform.OS === 'ios') {
  _isConnectedDeprecated = function(
    reachability: ReachabilityStateIOS,
  ): bool {
    return reachability !== 'none' && reachability !== 'unknown';
  };
} else if (Platform.OS === 'android') {
  _isConnectedDeprecated = function(
      connectionType: ConnectivityStateAndroid,
    ): bool {
    return connectionType !== 'NONE' && connectionType !== 'UNKNOWN';
  };
}

function _isConnected(connection) {
  return connection.type !== 'none' && connection.type !== 'unknown';
}

const _isConnectedSubscriptions = new Map();

/**
 * NetInfo exposes info about online/offline status
 *
 * ```
 * NetInfo.getConnectionInfo().then((connectionInfo) => {
 *   console.log('Initial, type: ' + connectionInfo.type + ', effectiveType: ' + connectionInfo.effectiveType);
 * });
 * function handleFirstConnectivityChange(connectionInfo) {
 *   console.log('First change, type: ' + connectionInfo.type + ', effectiveType: ' + connectionInfo.effectiveType);
 *   NetInfo.removeEventListener(
 *     'connectionChange',
 *     handleFirstConnectivityChange
 *   );
 * }
 * NetInfo.addEventListener(
 *   'connectionChange',
 *   handleFirstConnectivityChange
 * );
 * ```
 *
 * ### ConnectionType enum
 *
 * `ConnectionType` describes the type of connection the device is using to communicate with the network.
 *
 * Cross platform values for `ConnectionType`:
 * - `none` - device is offline
 * - `wifi` - device is online and connected via wifi, or is the iOS simulator
 * - `cellular` - device is connected via Edge, 3G, WiMax, or LTE
 * - `unknown` - error case and the network status is unknown
 *
 * Android-only values for `ConnectionType`:
 * - `bluetooth` - device is connected via Bluetooth
 * - `ethernet` - device is connected via Ethernet
 * - `wimax` - device is connected via WiMAX
 *
 * ### EffectiveConnectionType enum
 *
 * Cross platform values for `EffectiveConnectionType`:
 * - `2g`
 * - `3g`
 * - `4g`
 * - `unknown`
 *
 * ### Android
 *
 * To request network info, you need to add the following line to your
 * app's `AndroidManifest.xml`:
 *
 * `<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />`
 *
 * ### isConnectionExpensive
 *
 * Available on Android. Detect if the current active connection is metered or not. A network is
 * classified as metered when the user is sensitive to heavy data usage on that connection due to
 * monetary costs, data limitations or battery/performance issues.
 *
 * ```
 * NetInfo.isConnectionExpensive()
 * .then(isConnectionExpensive => {
 *   console.log('Connection is ' + (isConnectionExpensive ? 'Expensive' : 'Not Expensive'));
 * })
 * .catch(error => {
 *   console.error(error);
 * });
 * ```
 *
 * ### isConnected
 *
 * Available on all platforms. Asynchronously fetch a boolean to determine
 * internet connectivity.
 *
 * ```
 * NetInfo.isConnected.fetch().then(isConnected => {
 *   console.log('First, is ' + (isConnected ? 'online' : 'offline'));
 * });
 * function handleFirstConnectivityChange(isConnected) {
 *   console.log('Then, is ' + (isConnected ? 'online' : 'offline'));
 *   NetInfo.isConnected.removeEventListener(
 *     'connectionChange',
 *     handleFirstConnectivityChange
 *   );
 * }
 * NetInfo.isConnected.addEventListener(
 *   'connectionChange',
 *   handleFirstConnectivityChange
 * );
 * ```
 *
 * ### Connectivity Types (deprecated)
 *
 * The following connectivity types are deprecated. They're used by the deprecated APIs `fetch` and the `change` event.
 *
 * iOS connectivity types (deprecated):
 * - `none` - device is offline
 * - `wifi` - device is online and connected via wifi, or is the iOS simulator
 * - `cell` - device is connected via Edge, 3G, WiMax, or LTE
 * - `unknown` - error case and the network status is unknown
 *
 * Android connectivity types (deprecated).
 * - `NONE` - device is offline
 * - `BLUETOOTH` - The Bluetooth data connection.
 * - `DUMMY` -  Dummy data connection.
 * - `ETHERNET` - The Ethernet data connection.
 * - `MOBILE` - The Mobile data connection.
 * - `MOBILE_DUN` - A DUN-specific Mobile data connection.
 * - `MOBILE_HIPRI` - A High Priority Mobile data connection.
 * - `MOBILE_MMS` - An MMS-specific Mobile data connection.
 * - `MOBILE_SUPL` -  A SUPL-specific Mobile data connection.
 * - `VPN` -  A virtual network using one or more native bearers. Requires API Level 21
 * - `WIFI` - The WIFI data connection.
 * - `WIMAX` -  The WiMAX data connection.
 * - `UNKNOWN` - Unknown data connection.
 *
 * The rest of the connectivity types are hidden by the Android API, but can be used if necessary.
 */
const NetInfo = {
  /**
   * Adds an event handler. Supported events:
   *
   * - `connectionChange`: Fires when the network status changes. The argument to the event
   *   handler is an object with keys:
   *   - `type`: A `ConnectionType` (listed above)
   *   - `effectiveType`: An `EffectiveConnectionType` (listed above)
   * - `change`: This event is deprecated. Listen to `connectionChange` instead. Fires when
   *   the network status changes. The argument to the event handler is one of the deprecated
   *   connectivity types listed above.
   */
  addEventListener(
    eventName: ChangeEventName,
    handler: Function
  ): {remove: () => void} {
    let listener;
    if (eventName === 'connectionChange') {
      listener = NetInfoEventEmitter.addListener(
        DEVICE_CONNECTIVITY_EVENT,
        (appStateData) => {
          handler({
            type: appStateData.connectionType,
            effectiveType: appStateData.effectiveConnectionType
          });
        }
      );
    } else if (eventName === 'change') {
      console.warn('NetInfo\'s "change" event is deprecated. Listen to the "connectionChange" event instead.');

      listener = NetInfoEventEmitter.addListener(
        DEVICE_CONNECTIVITY_EVENT,
        (appStateData) => {
          handler(appStateData.network_info);
        }
      );
    } else {
      console.warn('Trying to subscribe to unknown event: "' + eventName + '"');
      return {
        remove: () => {}
      };
    }

    _subscriptions.set(handler, listener);
    return {
      remove: () => NetInfo.removeEventListener(eventName, handler)
    };
  },

  /**
   * Removes the listener for network status changes.
   */
  removeEventListener(
    eventName: ChangeEventName,
    handler: Function
  ): void {
    const listener = _subscriptions.get(handler);
    if (!listener) {
      return;
    }
    listener.remove();
    _subscriptions.delete(handler);
  },

  /**
   * This function is deprecated. Use `getConnectionInfo` instead. Returns a promise that
   * resolves with one of the deprecated connectivity types listed above.
   */
  fetch(): Promise<any> {
    console.warn('NetInfo.fetch() is deprecated. Use NetInfo.getConnectionInfo() instead.');
    return RCTNetInfo.getCurrentConnectivity().then(resp => resp.network_info);
  },

  /**
   * Returns a promise that resolves to an object with `type` and `effectiveType` keys
   * whose values are a `ConnectionType` and an `EffectiveConnectionType`, (described above),
   * respectively.
   */
  getConnectionInfo(): Promise<any> {
    return RCTNetInfo.getCurrentConnectivity().then(resp => {
      return {
        type: resp.connectionType,
        effectiveType: resp.effectiveConnectionType,
      };
    });
  },

  /**
   * An object with the same methods as above but the listener receives a
   * boolean which represents the internet connectivity.
   * Use this if you are only interested with whether the device has internet
   * connectivity.
   */
  isConnected: {
    addEventListener(
      eventName: ChangeEventName,
      handler: Function
    ): {remove: () => void} {
      const listener = (connection) => {
        if (eventName === 'change') {
          handler(_isConnectedDeprecated(connection));
        } else if (eventName === 'connectionChange') {
          handler(_isConnected(connection));
        }
      };
      _isConnectedSubscriptions.set(handler, listener);
      NetInfo.addEventListener(
        eventName,
        listener
      );
      return {
        remove: () => NetInfo.isConnected.removeEventListener(eventName, handler)
      };
    },

    removeEventListener(
      eventName: ChangeEventName,
      handler: Function
    ): void {
      const listener = _isConnectedSubscriptions.get(handler);
      NetInfo.removeEventListener(
        eventName,
        /* $FlowFixMe(>=0.36.0 site=react_native_fb,react_native_oss) Flow error
         * detected during the deploy of Flow v0.36.0. To see the error, remove
         * this comment and run Flow */
        listener
      );
      _isConnectedSubscriptions.delete(handler);
    },

    fetch(): Promise<any> {
      return NetInfo.getConnectionInfo().then(_isConnected);
    },
  },

  isConnectionExpensive(): Promise<boolean> {
    return (
      Platform.OS === 'android' ? RCTNetInfo.isConnectionMetered() : Promise.reject(new Error('Currently not supported on iOS'))
    );
  },
};

module.exports = NetInfo;
