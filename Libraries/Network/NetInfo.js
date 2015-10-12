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

var Map = require('Map');
var NativeModules = require('NativeModules');
var Platform = require('Platform');
var RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');
var RCTNetInfo = NativeModules.NetInfo;

var DEVICE_REACHABILITY_EVENT = 'networkDidChange';

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
 * Asynchronously determine if the device is connected and details about that connection.
 *
 * Android Connectivity Types
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
 * The rest ConnectivityStates are hidden by the Android API, but can be used if necessary.
 *
 * ### isConnectionMetered
 *
 * Available on Android. Detect if the current active connection is metered or not. A network is
 * classified as metered when the user is sensitive to heavy data usage on that connection due to
 * monetary costs, data limitations or battery/performance issues.
 *
 * NetInfo.isConnectionMetered((isConnectionMetered) => {
 *   console.log('Connection is ' + (isConnectionMetered ? 'Metered' : 'Not Metered'));
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

var _subscriptions = new Map();

if (Platform.OS === 'ios') {
  var _isConnected = function(
    reachability: ReachabilityStateIOS
  ): bool {
    return reachability !== 'none' &&
      reachability !== 'unknown';
  };
} else if (Platform.OS === 'android') {
  var _isConnected = function(
      connectionType: ConnectivityStateAndroid
    ): bool {
    return connectionType !== 'NONE' && connectionType !== 'UNKNOWN';
  };
}

var _isConnectedSubscriptions = new Map();

var NetInfo = {
  addEventListener: function (
    eventName: ChangeEventName,
    handler: Function
  ): void {
    var listener = RCTDeviceEventEmitter.addListener(
      DEVICE_REACHABILITY_EVENT,
      (appStateData) => {
        handler(appStateData.network_info);
      }
    );
    _subscriptions.set(handler, listener);
  },

  removeEventListener: function(
    eventName: ChangeEventName,
    handler: Function
  ): void {
    var listener = _subscriptions.get(handler);
    if (!listener) {
      return;
    }
    listener.remove();
    _subscriptions.delete(handler);
  },

  fetch: function(): Promise {
    return new Promise((resolve, reject) => {
      RCTNetInfo.getCurrentReachability(
        function(resp) {
          resolve(resp.network_info);
        },
        reject
      );
    });
  },

  isConnected: {
    addEventListener: function (
      eventName: ChangeEventName,
      handler: Function
    ): void {
      var listener = (connection) => {
        handler(_isConnected(connection));
      };
      _isConnectedSubscriptions.set(handler, listener);
      NetInfo.addEventListener(
        eventName,
        listener
      );
    },

    removeEventListener: function(
      eventName: ChangeEventName,
      handler: Function
    ): void {
      var listener = _isConnectedSubscriptions.get(handler);
      NetInfo.removeEventListener(
        eventName,
        listener
      );
      _isConnectedSubscriptions.delete(handler);
    },

    fetch: function(): Promise {
      return NetInfo.fetch().then(
        (connection) => _isConnected(connection)
      );
    },
  },

  isConnectionMetered: ({}: {} | (callback:Function) => void),
};

if (Platform.OS === 'android') {
  NetInfo.isConnectionMetered = function(callback): void {
    RCTNetInfo.isConnectionMetered((_isMetered) => {
      callback(_isMetered);
    });
  };
}

module.exports = NetInfo;
