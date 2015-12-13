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
 * ### isConnectionExpensive
 *
 * Available on Android. Detect if the current active connection is metered or not. A network is
 * classified as metered when the user is sensitive to heavy data usage on that connection due to
 * monetary costs, data limitations or battery/performance issues.
 *
 * ```
 * NetInfo.isConnectionExpensive((isConnectionExpensive) => {
 *   console.log('Connection is ' + (isConnectionExpensive ? 'Expensive' : 'Not Expensive'));
 * });
 * ```
 *
 * ### isConnected
 *
 * Available on all platforms. Asynchronously fetch a boolean to determine
 * internet connectivity.
 *
 * ```
 * NetInfo.isConnected.fetch().done((isConnected) => {
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
  addEventListener(
    eventName: ChangeEventName,
    handler: Function
  ): void {
    const listener = RCTDeviceEventEmitter.addListener(
      DEVICE_CONNECTIVITY_EVENT,
      (appStateData) => {
        handler(appStateData.network_info);
      }
    );
    _subscriptions.set(handler, listener);
  },

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

  fetch(): Promise {
    return new Promise((resolve, reject) => {
      RCTNetInfo.getCurrentConnectivity(
        function(resp) {
          resolve(resp.network_info);
        },
        reject
      );
    });
  },

  isConnected: {
    addEventListener(
      eventName: ChangeEventName,
      handler: Function
    ): void {
      const listener = (connection) => {
        handler(_isConnected(connection));
      };
      _isConnectedSubscriptions.set(handler, listener);
      NetInfo.addEventListener(
        eventName,
        listener
      );
    },

    removeEventListener(
      eventName: ChangeEventName,
      handler: Function
    ): void {
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

  isConnectionExpensive(callback: (metered: ?boolean, error?: string) => void): void {
    if (Platform.OS === 'android') {
      RCTNetInfo.isConnectionMetered((_isMetered) => {
        callback(_isMetered);
      });
    } else {
      // TODO t9296080 consider polyfill and more features later on
      callback(null, "Unsupported");
    }
  },
};

module.exports = NetInfo;
