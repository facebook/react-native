/**
 * @providesModule LocalNotificationIOS
 */
'use strict';

var NativeModules = require('NativeModules');
var RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');
var RCTLocalNotificationManager = NativeModules.LocalNotificationManager;
var invariant = require('invariant');

var _notificationHandlers = {};
var _permissionHandlers = {};

var DEVICE_LOCAL_NOTIFICATION_EVENT = 'localNotificationReceived';
var DEVICE_PERMISSIONS_EVENT = 'notificationPermissionsReceived';

/**
 * Handles local notifications, including permissions, and icon badge number.
 */
var LocalNotificationIOS = {

  /**
   * Sets the badge number for the app icon
   */
  setApplicationIconBadgeNumber: function(number: number) {
    invariant(typeof number === 'number',
      'You must provide a valid badge number');

    RCTLocalNotificationManager.setApplicationIconBadgeNumber(number);
  },

  /**
   * Gets the badge number for the app icon
   */
  getApplicationIconBadgeNumber: function(callback: Function) {
    invariant(typeof callback === 'function',
      'You must provide a valid callback function');

    RCTLocalNotificationManager.getApplicationIconBadgeNumber(callback);
  },

  /**
   * Checks which local and remote push permissions are currently granted. The
   * `callback` function will be invoked with a `permissions` object:
   *
   *  - `alert`: boolean
   *  - `badge`: boolean
   *  - `sound`: boolean
   */
  checkPermissions: function(callback: Function) {
    invariant(typeof callback === 'function',
      'You must provide a valid callback function');

    RCTLocalNotificationManager.checkPermissions(callback);
  },

  /**
   * Requests all (alert, badge, and sound) notification permissions from iOS.
   */
  requestPermissions: function() {
    RCTLocalNotificationManager.requestPermissions();
  },

  /**
   * Immediately sends a local notification to the app. Must be invoked with a
   * `notification` object:
   *
   * - `body`: string
   * - `title`: string
   * - `action`: string
   */
  presentNotification: function(notification: Object) {
    invariant(typeof notification === 'object',
      'You must provide a valid notification object');

    RCTLocalNotificationManager.presentLocalNotificationNow(notification);
  },

  /**
   * Adds a listener for permissions. The `handler` function will be invoked
   * with a `permissions` object:
   *
   *  - `alert`: boolean
   *  - `badge`: boolean
   *  - `sound`: boolean
   */
  addPermissionsListener: function(handler: Function) {
    invariant(typeof handler === 'function',
      'You must provide a valid callback function');

    _permissionHandlers[handler] = RCTDeviceEventEmitter.addListener(
      DEVICE_PERMISSIONS_EVENT,
      (permissions) => {
        handler(permissions);
      });
  },

  /**
   * Adds a listener for local notifications. The `handler` function will be
   * invoked with a `notification` object:
   *
   * - `body`: string
   * - `title`: string
   * - `action`: string
   */
  addNotificationListener: function(handler: Function) {
    invariant(typeof handler === 'function',
      'You must provide a valid callback function');

    _notificationHandlers[handler] = RCTDeviceEventEmitter.addListener(
      DEVICE_LOCAL_NOTIFICATION_EVENT,
      (notification) => {
        handler(notification);
      });
  },

  /**
   * Removes the event listener. Do this in `componentWillUnmount` to prevent
   * memory leaks.
   */
  removeEventListener: function(handler: Function) {
    invariant(typeof handler === 'function',
      'You must provide a valid callback function');

    if (_notificationHandlers[handler]) {
      _notificationHandlers[handler].remove();
      _notificationHandlers[handler] = null;
      return;
    }

    if (_permissionHandlers[handler]) {
      _permissionHandlers[handler].remove();
      _permissionHandlers[handler] = null;
      return;
    }
  }
}

module.exports = LocalNotificationIOS;
