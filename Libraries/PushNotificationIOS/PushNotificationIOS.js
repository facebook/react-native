/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule PushNotificationIOS
 * @flow
 */
'use strict';

var NativeModules = require('NativeModules');
var RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');
var RCTPushNotificationManager = require('NativeModules').PushNotificationManager;
var invariant = require('invariant');

var _notifHandlers = {};
var _initialNotification = RCTPushNotificationManager &&
  RCTPushNotificationManager.initialNotification;

var DEVICE_NOTIF_EVENT = 'remoteNotificationReceived';

class PushNotificationIOS {
  _data: Object;
  _alert: string | Object;
  _sound: string;
  _badgeCount: number;

  static setApplicationIconBadgeNumber(number) {
    RCTPushNotificationManager.setApplicationIconBadgeNumber(number);
  }

  static getApplicationIconBadgeNumber(callback) {
    RCTPushNotificationManager.getApplicationIconBadgeNumber(callback);
  }

  static addEventListener(type, handler) {
    _notifHandlers[handler] = RCTDeviceEventEmitter.addListener(
      DEVICE_NOTIF_EVENT,
      (notifData) => {
        handler(new PushNotificationIOS(notifData));
      }
    );
  }

  static requestPermissions() {
    RCTPushNotificationManager.requestPermissions();
  }

  static checkPermissions(callback) {
    invariant(
      typeof callback === 'function',
      'Must provide a valid callback'
    );
    RCTPushNotificationManager.checkPermissions(callback);
  }

  static removeEventListener(type, handler) {
    if (!_notifHandlers[handler]) {
      return;
    }
    _notifHandlers[handler].remove();
    _notifHandlers[handler] = null;
  }


  static popInitialNotification() {
    var initialNotification = _initialNotification &&
      new PushNotificationIOS(_initialNotification);
    _initialNotification = null;
    return initialNotification;
  }

  constructor(nativeNotif) {
    this._data = {};

    // Extract data from Apple's `aps` dict as defined:

    // https://developer.apple.com/library/ios/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/Chapters/ApplePushService.html

    Object.keys(nativeNotif).forEach((notifKey) => {
      var notifVal = nativeNotif[notifKey];
      if (notifKey === 'aps') {
        this._alert = notifVal.alert;
        this._sound = notifVal.sound;
        this._badgeCount = notifVal.badge;
      } else {
        this._data[notifKey] = notifVal;
      }
    });
  }

  getMessage(): ?string | ?Object {
    // alias because "alert" is an ambiguous name
    return this._alert;
  }

  getSound(): ?string {
    return this._sound;
  }

  getAlert(): ?string | ?Object {
    return this._alert;
  }

  getBadgeCount(): ?number {
    return this._badgeCount;
  }

  getData(): ?Object {
    return this._data;
  }
}

module.exports = PushNotificationIOS;
