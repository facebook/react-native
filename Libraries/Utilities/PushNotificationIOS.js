/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule PushNotificationIOS
 */
'use strict';

var RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');

var _notifHandlers = {};

var DEVICE_NOTIF_EVENT = 'remoteNotificationReceived';

class PushNotificationIOS {

  static addEventListener(type, handler) {
    _notifHandlers[handler] = RCTDeviceEventEmitter.addListener(
      DEVICE_NOTIF_EVENT,
      (notifData) => {
        handler(new PushNotificationIOS(notifData));
      }
    );
  }

  static removeEventListener(type, handler) {
    if (!_notifHandlers[handler]) {
      return;
    }
    _notifHandlers[handler].remove();
    _notifHandlers[handler] = null;
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

  getMessage() {
    // alias because "alert" is an ambiguous name
    return this._alert;
  }

  getSound() {
    return this._sound;
  }

  getAlert() {
    return this._alert;
  }

  getBadgeCount() {
    return this._badgeCount;
  }

  getData() {
    return this._data;
  }
}

module.exports = PushNotificationIOS;
