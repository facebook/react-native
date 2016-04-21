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
const NativeModules = require('NativeModules');
const Platform = require('Platform');
const RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');
const RCTNetInfo = NativeModules.NetInfo;
const deprecatedCallback = require('deprecatedCallback');

const DEVICE_CONNECTIVITY_EVENT = 'networkStatusDidChange';

type ChangeEventName = $Enum<{
  change: string;
}>;

type ReachabilityStateIOS = $Enum<{
  cell: string;
  none: string;
  unknown: string;
  wifi: string;
}>;

type ConnectivityStateAndroid = $Enum<{
  NONE: string;
  MOBILE: string;
  WIFI: string;
  MOBILE_MMS: string;
  MOBILE_SUPL: string;
  MOBILE_DUN: string;
  MOBILE_HIPRI: string;
  WIMAX: string;
  BLUETOOTH: string;
  DUMMY: string;
  ETHERNET: string;
  MOBILE_FOTA: string;
  MOBILE_IMS: string;
  MOBILE_CBS: string;
  WIFI_P2P: string;
  MOBILE_IA: string;
  MOBILE_EMERGENCY: string;
  PROXY: string;
  VPN: string;
  UNKNOWN: string;
}>;

type ConnectivityStateWindows = $Enum<{
  None: string;
  LocalAccess: string;
  ConstrainedInternetAccess: string;
  InternetAccess: string;
}>;

const _subscriptions = new Map();

let _isConnected;
if (Platform.OS === 'ios') {
  _isConnected = function(
    reachability: ReachabilityStateIOS,
  ): bool {
    return reachability !== 'none' && reachability !== 'unknown';
  };
} else if (Platform.OS === 'android') {
  _isConnected = function(
      connectionType: ConnectivityStateAndroid,
    ): bool {
    return connectionType !== 'NONE' && connectionType !== 'UNKNOWN';
  };
} else if (Platform.OS === 'windows') {
  _isConnected = function(
      connectionType: ConnectivityStateWindows,
    ): bool {
    return connectionType !== 'None' && connectionType !== 'LocalAccess';
  }
}

const _isConnectedSubscriptions = new Map();

/**
 * NetInfo exposes info about online/offline status
 *
 * ```
 * NetInfo.fetch().done((reach) => {
 *   console.log('Initial: ' + reach);
 * });
 * function handleFirstConnectivityChange(reach) {
 *   console.log('First change: ' + reach);
 *   NetInfo.removeEventListener(
 *     'change',
 *     handleFirstConnectivityChange
 *   );
 * }
 * NetInfo.addEventListener(
 *   'change',
 *   handleFirstConnectivityChange
 * );
 * ```
 *
 * ### IOS
 *
 * Asynchronously determine if the device is online and on a cellular network.
 *
 * - `none` - device is offline
 * - `wifi` - device is online and connected via wifi, or is the iOS simulator
 * - `cell` - device is connected via Edge, 3G, WiMax, or LTE
 * - `unknown` - error case and the network status is unknown
 *
 * ### Android
 *
 * To request network info, you need to add the following line to your
 * app's `AndroidManifest.xml`:
 *
 * `<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />`
 * Asynchronously determine if the device is connected and details about that connection.
 *
 * Android Connectivity Types.
 *
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
 * The rest ConnectivityStates are hidden by the Android API, but can be used if necessary.
 *
 * ### Windows
 * 
 * Asynchronously determine if the device is connected and details about that connection.
 * 
 * Windows Connectivity Types.
 *
 * - `None` - No connectivity.
 * - `LocalAccess` - Local network access only.
 * - `ConstrainedInternetAccess` - Limited internet access.
 * - `InternetAccess` - Local and Internet access.
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
 *     'change',
 *     handleFirstConnectivityChange
 *   );
 * }
 * NetInfo.isConnected.addEventListener(
 *   'change',
 *   handleFirstConnectivityChange
 * );
 * ```
 */
const NetInfo = {
  /**
   * Invokes the listener whenever network status changes.
   * The listener receives one of the connectivity types listed above.
   */
  addEventListener(
    eventName: ChangeEventName,
    handler: Function
  ): {remove: () => void} {
    const listener = RCTDeviceEventEmitter.addListener(
      DEVICE_CONNECTIVITY_EVENT,
      (appStateData) => {
        handler(appStateData.network_info);
      }
    );
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
   * Returns a promise that resolves with one of the connectivity types listed
   * above.
   */
  fetch(): Promise {
    return RCTNetInfo.getCurrentConnectivity().then(resp => resp.network_info);
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
        handler(_isConnected(connection));
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
      /* $FlowFixMe */
      const listener = _isConnectedSubscriptions.get(handler);
      NetInfo.removeEventListener(
        eventName,
        listener
      );
      _isConnectedSubscriptions.delete(handler);
    },

    fetch(): Promise {
      return NetInfo.fetch().then(
        (connection) => _isConnected(connection)
      );
    },
  },

  isConnectionExpensive(): Promise {
    return deprecatedCallback(
      Platform.OS === 'android' ? RCTNetInfo.isConnectionMetered() : Promise.reject(new Error('Currently not supported on iOS')),
      Array.prototype.slice.call(arguments),
      'single-callback-value-first',
      'NetInfo.isConnectionMetered(callback) is deprecated. Use the returned Promise instead.'
    );
  },
};

module.exports = NetInfo;
