/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule NetInfo
 * @flow
 */
'use strict';

var NativeModules = require('NativeModules');
var RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');
var RCTReachability = NativeModules.Reachability;

var DEVICE_REACHABILITY_EVENT = 'reachabilityDidChange';

type ChangeEventName = $Enum<{
  change: string;
}>;


/**
 * NetInfo exposes info about online/offline status
 *
 * == iOS Reachability
 *
 * Asyncronously determine if the device is online and on a cellular network.
 *
 * - "none" - device is offline
 * - "wifi" - device is online and connected via wifi, or is the iOS simulator
 * - "cell" - device is connected via Edge, 3G, WiMax, or LTE
 * - "unknown" - error case and the network status is unknown
 *
 * ```
 * NetInfo.reachabilityIOS.fetch().done((reach) => {
 *   console.log('Initial: ' + reach);
 * });
 * function handleFirstReachabilityChange(reach) {
 *   console.log('First change: ' + reach);
 *   NetInfo.reachabilityIOS.removeEventListener(
 *     'change',
 *     handleFirstReachabilityChange
 *   );
 * }
 * NetInfo.reachabilityIOS.addEventListener(
 *   'change',
 *   handleFirstReachabilityChange
 * );
 * ```
 */

var NetInfo = {};

if (RCTReachability) {
  var _reachabilitySubscriptions = {};

  NetInfo.reachabilityIOS = {
    addEventListener: function (
      eventName: ChangeEventName,
      handler: Function
    ): void {
      _reachabilitySubscriptions[handler] = RCTDeviceEventEmitter.addListener(
        DEVICE_REACHABILITY_EVENT,
        (appStateData) => {
          handler(appStateData.network_reachability);
        }
      );
    },

    removeEventListener: function(
      eventName: ChangeEventName,
      handler: Function
    ): void {
      if (!_reachabilitySubscriptions[handler]) {
        return;
      }
      _reachabilitySubscriptions[handler].remove();
      _reachabilitySubscriptions[handler] = null;
    },

    fetch: function(): Promise {
      return new Promise((resolve, reject) => {
        RCTReachability.getCurrentReachability(
          (resp) => {
            resolve(resp.network_reachability);
          },
          reject
        );
      });
    },
  };

  /**
   *
   * == NetInfo.isConnected
   *
   * Available on all platforms. Asyncronously fetch a boolean to determine
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
   *
   */
  var _isConnectedSubscriptions = {};
  NetInfo.isConnected = {
    addEventListener: function (
      eventName: ChangeEventName,
      handler: Function
    ): void {
      _isConnectedSubscriptions[handler] = (reachability) => {
        handler(reachability !== 'none');
      };
      NetInfo.reachabilityIOS.addEventListener(eventName, _isConnectedSubscriptions[handler]);
    },

    removeEventListener: function(
      eventName: ChangeEventName,
      handler: Function
    ): void {
      NetInfo.reachabilityIOS.removeEventListener(eventName, _isConnectedSubscriptions[handler]);
    },

    fetch: function(): Promise {
      return NetInfo.reachabilityIOS.fetch().then(
        (reachability) => reachability !== 'none'
      );
    },
  };
}

module.exports = NetInfo;
