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

var RCTDeviceEventEmitter = require('RCTDeviceEventEmitter');
var RCTPushNotificationManager = require('NativeModules').PushNotificationManager;
var invariant = require('invariant');

var _notifHandlers = new Map();
var _initialNotification = RCTPushNotificationManager &&
  RCTPushNotificationManager.initialNotification;

var DEVICE_NOTIF_EVENT = 'remoteNotificationReceived';
var NOTIF_REGISTER_EVENT = 'remoteNotificationsRegistered';

/**
 * Handle push notifications for your app, including permission handling and
 * icon badge number.
 *
 * To get up and running, [configure your notifications with Apple](https://developer.apple.com/library/ios/documentation/IDEs/Conceptual/AppDistributionGuide/AddingCapabilities/AddingCapabilities.html#//apple_ref/doc/uid/TP40012582-CH26-SW6)
 * and your server-side system. To get an idea, [this is the Parse guide](https://parse.com/tutorials/ios-push-notifications).
 *
 * [Manually link](docs/linking-libraries-ios.html#manual-linking) the PushNotificationIOS library
 *
 * - Be sure to add the following to your `Header Search Paths`:
 * `$(SRCROOT)/../node_modules/react-native/Libraries/PushNotificationIOS`
 * - Set the search to `recursive`
 *
 * Finally, to enable support for `notification` and `register` events you need to augment your AppDelegate.
 *
 * At the top of your `AppDelegate.m`:
 *
 *   `#import "RCTPushNotificationManager.h"`
 *
 * And then in your AppDelegate implementation add the following:
 *
 *   ```
 *    // Required to register for notifications
 *    - (void)application:(UIApplication *)application didRegisterUserNotificationSettings:(UIUserNotificationSettings *)notificationSettings
 *    {
 *     [RCTPushNotificationManager didRegisterUserNotificationSettings:notificationSettings];
 *    }
 *    // Required for the register event.
 *    - (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
 *    {
 *     [RCTPushNotificationManager didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
 *    }
 *    // Required for the notification event.
 *    - (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)notification
 *    {
 *     [RCTPushNotificationManager didReceiveRemoteNotification:notification];
 *    }
 *   ```
 */
class PushNotificationIOS {
  _data: Object;
  _alert: string | Object;
  _sound: string;
  _badgeCount: number;

  /**
   * Schedules the localNotification for immediate presentation.
   *
   * details is an object containing:
   *
   * - `alertBody` : The message displayed in the notification alert.
   * - `soundName` : The sound played when the notification is fired (optional).
   *
   */
  static presentLocalNotification(details: Object) {
    RCTPushNotificationManager.presentLocalNotification(details);
  }

  /**
   * Schedules the localNotification for future presentation.
   *
   * details is an object containing:
   *
   * - `fireDate` : The date and time when the system should deliver the notification.
   * - `alertBody` : The message displayed in the notification alert.
   * - `soundName` : The sound played when the notification is fired (optional).
   *
   */
  static scheduleLocalNotification(details: Object) {
    RCTPushNotificationManager.scheduleLocalNotification(details);
  }

  /**
   * Cancels all scheduled localNotifications
   */
  static cancelAllLocalNotifications() {
    RCTPushNotificationManager.cancelAllLocalNotifications();
  }

  /**
   * Sets the badge number for the app icon on the home screen
   */
  static setApplicationIconBadgeNumber(number: number) {
    RCTPushNotificationManager.setApplicationIconBadgeNumber(number);
  }

  /**
   * Gets the current badge number for the app icon on the home screen
   */
  static getApplicationIconBadgeNumber(callback: Function) {
    RCTPushNotificationManager.getApplicationIconBadgeNumber(callback);
  }

  /**
   * Attaches a listener to remote notification events while the app is running
   * in the foreground or the background.
   *
   * Valid events are:
   *
   * - `notification` : Fired when a remote notification is received. The
   *   handler will be invoked with an instance of `PushNotificationIOS`.
   * - `register`: Fired when the user registers for remote notifications. The
   *   handler will be invoked with a hex string representing the deviceToken.
   */
  static addEventListener(type: string, handler: Function) {
    invariant(
      type === 'notification' || type === 'register',
      'PushNotificationIOS only supports `notification` and `register` events'
    );
    var listener;
    if (type === 'notification') {
      listener =  RCTDeviceEventEmitter.addListener(
        DEVICE_NOTIF_EVENT,
        (notifData) => {
          handler(new PushNotificationIOS(notifData));
        }
      );
    } else if (type === 'register') {
      listener = RCTDeviceEventEmitter.addListener(
        NOTIF_REGISTER_EVENT,
        (registrationInfo) => {
          handler(registrationInfo.deviceToken);
        }
      );
    }
    _notifHandlers.set(handler, listener);
  }

  /**
   * Requests notification permissions from iOS, prompting the user's
   * dialog box. By default, it will request all notification permissions, but
   * a subset of these can be requested by passing a map of requested
   * permissions.
   * The following permissions are supported:
   *
   *   - `alert`
   *   - `badge`
   *   - `sound`
   *
   * If a map is provided to the method, only the permissions with truthy values
   * will be requested.
   */
  static requestPermissions(permissions?: {
    alert?: boolean,
    badge?: boolean,
    sound?: boolean
  }) {
    var requestedPermissions = {};
    if (permissions) {
      requestedPermissions = {
        alert: !!permissions.alert,
        badge: !!permissions.badge,
        sound: !!permissions.sound
      };
    } else {
      requestedPermissions = {
        alert: true,
        badge: true,
        sound: true
      };
    }
    RCTPushNotificationManager.requestPermissions(requestedPermissions);
  }

  /**
   * Unregister for all remote notifications received via Apple Push Notification service.
   *
   * You should call this method in rare circumstances only, such as when a new version of
   * the app removes support for all types of remote notifications. Users can temporarily
   * prevent apps from receiving remote notifications through the Notifications section of
   * the Settings app. Apps unregistered through this method can always re-register.
   */
  static abandonPermissions() {
    RCTPushNotificationManager.abandonPermissions();
  }

  /**
   * See what push permissions are currently enabled. `callback` will be
   * invoked with a `permissions` object:
   *
   *  - `alert` :boolean
   *  - `badge` :boolean
   *  - `sound` :boolean
   */
  static checkPermissions(callback: Function) {
    invariant(
      typeof callback === 'function',
      'Must provide a valid callback'
    );
    RCTPushNotificationManager.checkPermissions(callback);
  }

  /**
   * Removes the event listener. Do this in `componentWillUnmount` to prevent
   * memory leaks
   */
  static removeEventListener(type: string, handler: Function) {
    invariant(
      type === 'notification' || type === 'register',
      'PushNotificationIOS only supports `notification` and `register` events'
    );
    var listener = _notifHandlers.get(handler);
    if (!listener) {
      return;
    }
    listener.remove();
    _notifHandlers.delete(handler);
  }


  /**
   * An initial notification will be available if the app was cold-launched
   * from a notification.
   *
   * The first caller of `popInitialNotification` will get the initial
   * notification object, or `null`. Subsequent invocations will return null.
   */
  static popInitialNotification() {
    var initialNotification = _initialNotification &&
      new PushNotificationIOS(_initialNotification);
    _initialNotification = null;
    return initialNotification;
  }

  /**
   * You will never need to instantiate `PushNotificationIOS` yourself.
   * Listening to the `notification` event and invoking
   * `popInitialNotification` is sufficient
   */
  constructor(nativeNotif: Object) {
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

  /**
   * An alias for `getAlert` to get the notification's main message string
   */
  getMessage(): ?string | ?Object {
    // alias because "alert" is an ambiguous name
    return this._alert;
  }

  /**
   * Gets the sound string from the `aps` object
   */
  getSound(): ?string {
    return this._sound;
  }

  /**
   * Gets the notification's main message from the `aps` object
   */
  getAlert(): ?string | ?Object {
    return this._alert;
  }

  /**
   * Gets the badge count number from the `aps` object
   */
  getBadgeCount(): ?number {
    return this._badgeCount;
  }

  /**
   * Gets the data object on the notif
   */
  getData(): ?Object {
    return this._data;
  }
}

module.exports = PushNotificationIOS;
