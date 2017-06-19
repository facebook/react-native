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

const NativeEventEmitter = require('NativeEventEmitter');
const RCTPushNotificationManager = require('NativeModules').PushNotificationManager;
const invariant = require('fbjs/lib/invariant');

const PushNotificationEmitter = new NativeEventEmitter(RCTPushNotificationManager);

const _notifHandlers = new Map();

const DEVICE_NOTIF_EVENT = 'remoteNotificationReceived';
const NOTIF_REGISTER_EVENT = 'remoteNotificationsRegistered';
const NOTIF_REGISTRATION_ERROR_EVENT = 'remoteNotificationRegistrationError';
const DEVICE_LOCAL_NOTIF_EVENT = 'localNotificationReceived';

export type FetchResult = {
  NewData: string,
  NoData: string,
  ResultFailed: string,
};

/**
 * An event emitted by PushNotificationIOS.
 */
export type PushNotificationEventName = $Enum<{
  /**
   * Fired when a remote notification is received. The handler will be invoked
   * with an instance of `PushNotificationIOS`.
   */
  notification: string,
  /**
   * Fired when a local notification is received. The handler will be invoked
   * with an instance of `PushNotificationIOS`.
   */
  localNotification: string,
  /**
   * Fired when the user registers for remote notifications. The handler will be
   * invoked with a hex string representing the deviceToken.
   */
  register: string,
  /**
   * Fired when the user fails to register for remote notifications. Typically
   * occurs when APNS is having issues, or the device is a simulator. The
   * handler will be invoked with {message: string, code: number, details: any}.
   */
  registrationError: string,
}>;

/**
 * <div class="banner-crna-ejected">
 *   <h3>Projects with Native Code Only</h3>
 *   <p>
 *     This section only applies to projects made with <code>react-native init</code>
 *     or to those made with Create React Native App which have since ejected. For
 *     more information about ejecting, please see
 *     the <a href="https://github.com/react-community/create-react-native-app/blob/master/EJECTING.md" target="_blank">guide</a> on
 *     the Create React Native App repository.
 *   </p>
 * </div>
 *
 * Handle push notifications for your app, including permission handling and
 * icon badge number.
 *
 * To get up and running, [configure your notifications with Apple](https://developer.apple.com/library/ios/documentation/IDEs/Conceptual/AppDistributionGuide/AddingCapabilities/AddingCapabilities.html#//apple_ref/doc/uid/TP40012582-CH26-SW6)
 * and your server-side system.
 *
 * [Manually link](docs/linking-libraries-ios.html#manual-linking) the PushNotificationIOS library
 *
 * - Add the following to your Project: `node_modules/react-native/Libraries/PushNotificationIOS/RCTPushNotification.xcodeproj`
 * - Add the following to `Link Binary With Libraries`: `libRCTPushNotification.a`
 *
 * Finally, to enable support for `notification` and `register` events you need to augment your AppDelegate.
 *
 * At the top of your `AppDelegate.m`:
 *
 *   `#import <React/RCTPushNotificationManager.h>`
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
 *    // Required for the notification event. You must call the completion handler after handling the remote notification.
 *    - (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo
 *                                                           fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
 *    {
 *      [RCTPushNotificationManager didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
 *    }
 *    // Required for the registrationError event.
 *    - (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
 *    {
 *     [RCTPushNotificationManager didFailToRegisterForRemoteNotificationsWithError:error];
 *    }
 *    // Required for the localNotification event.
 *    - (void)application:(UIApplication *)application didReceiveLocalNotification:(UILocalNotification *)notification
 *    {
 *     [RCTPushNotificationManager didReceiveLocalNotification:notification];
 *    }
 *   ```
 */
class PushNotificationIOS {
  _data: Object;
  _alert: string | Object;
  _sound: string;
  _category: string;
  _badgeCount: number;
  _notificationId: string;
  _isRemote: boolean;
  _remoteNotificationCompleteCalllbackCalled: boolean;

  static FetchResult: FetchResult = {
    NewData: 'UIBackgroundFetchResultNewData',
    NoData: 'UIBackgroundFetchResultNoData',
    ResultFailed: 'UIBackgroundFetchResultFailed',
  };

  /**
   * Schedules the localNotification for immediate presentation.
   *
   * details is an object containing:
   *
   * - `alertBody` : The message displayed in the notification alert.
   * - `alertAction` : The "action" displayed beneath an actionable notification. Defaults to "view";
   * - `soundName` : The sound played when the notification is fired (optional).
   * - `isSilent`  : If true, the notification will appear without sound (optional).
   * - `category`  : The category of this notification, required for actionable notifications (optional).
   * - `userInfo`  : An optional object containing additional notification data.
   * - `applicationIconBadgeNumber` (optional) : The number to display as the app's icon badge. The default value of this property is 0, which means that no badge is displayed.
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
   * - `alertAction` : The "action" displayed beneath an actionable notification. Defaults to "view";
   * - `soundName` : The sound played when the notification is fired (optional).
   * - `isSilent`  : If true, the notification will appear without sound (optional).
   * - `category`  : The category of this notification, required for actionable notifications (optional).
   * - `userInfo` : An optional object containing additional notification data.
   * - `applicationIconBadgeNumber` (optional) : The number to display as the app's icon badge. Setting the number to 0 removes the icon badge.
   * - `repeatInterval` : The interval to repeat as a string.  Possible values: `minute`, `hour`, `day`, `week`, `month`, `year`.
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
   * Remove all delivered notifications from Notification Center
   */
  static removeAllDeliveredNotifications(): void {
    RCTPushNotificationManager.removeAllDeliveredNotifications();
  }

  /**
   * Provides you with a list of the app’s notifications that are still displayed in Notification Center
   *
   * @param callback Function which receive an array of delivered notifications
   *
   *  A delivered notification is an object containing:
   *
   * - `identifier`  : The identifier of this notification.
   * - `title`  : The title of this notification.
   * - `body`  : The body of this notification.
   * - `category`  : The category of this notification, if has one.
   * - `userInfo`  : An optional object containing additional notification data.
   * - `thread-id`  : The thread identifier of this notification, if has one.
   */
  static getDeliveredNotifications(callback: (notifications: [Object]) => void): void {
    RCTPushNotificationManager.getDeliveredNotifications(callback);
  }

  /**
   * Removes the specified notifications from Notification Center
   *
   * @param identifiers Array of notification identifiers
   */
  static removeDeliveredNotifications(identifiers: [string]): void {
    RCTPushNotificationManager.removeDeliveredNotifications(identifiers);
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
   * Cancel local notifications.
   *
   * Optionally restricts the set of canceled notifications to those
   * notifications whose `userInfo` fields match the corresponding fields
   * in the `userInfo` argument.
   */
  static cancelLocalNotifications(userInfo: Object) {
    RCTPushNotificationManager.cancelLocalNotifications(userInfo);
  }

  /**
   * Gets the local notifications that are currently scheduled.
   */
  static getScheduledLocalNotifications(callback: Function) {
    RCTPushNotificationManager.getScheduledLocalNotifications(callback);
  }

  /**
   * Attaches a listener to remote or local notification events while the app is running
   * in the foreground or the background.
   *
   * Valid events are:
   *
   * - `notification` : Fired when a remote notification is received. The
   *   handler will be invoked with an instance of `PushNotificationIOS`.
   * - `localNotification` : Fired when a local notification is received. The
   *   handler will be invoked with an instance of `PushNotificationIOS`.
   * - `register`: Fired when the user registers for remote notifications. The
   *   handler will be invoked with a hex string representing the deviceToken.
   * - `registrationError`: Fired when the user fails to register for remote
   *   notifications. Typically occurs when APNS is having issues, or the device
   *   is a simulator. The handler will be invoked with
   *   {message: string, code: number, details: any}.
   */
  static addEventListener(type: PushNotificationEventName, handler: Function) {
    invariant(
      type === 'notification' || type === 'register' || type === 'registrationError' || type === 'localNotification',
      'PushNotificationIOS only supports `notification`, `register`, `registrationError`, and `localNotification` events'
    );
    var listener;
    if (type === 'notification') {
      listener =  PushNotificationEmitter.addListener(
        DEVICE_NOTIF_EVENT,
        (notifData) => {
          handler(new PushNotificationIOS(notifData));
        }
      );
    } else if (type === 'localNotification') {
      listener = PushNotificationEmitter.addListener(
        DEVICE_LOCAL_NOTIF_EVENT,
        (notifData) => {
          handler(new PushNotificationIOS(notifData));
        }
      );
    } else if (type === 'register') {
      listener = PushNotificationEmitter.addListener(
        NOTIF_REGISTER_EVENT,
        (registrationInfo) => {
          handler(registrationInfo.deviceToken);
        }
      );
    } else if (type === 'registrationError') {
      listener = PushNotificationEmitter.addListener(
        NOTIF_REGISTRATION_ERROR_EVENT,
        (errorInfo) => {
          handler(errorInfo);
        }
      );
    }
    _notifHandlers.set(type, listener);
  }

  /**
   * Removes the event listener. Do this in `componentWillUnmount` to prevent
   * memory leaks
   */
  static removeEventListener(type: PushNotificationEventName, handler: Function) {
    invariant(
      type === 'notification' || type === 'register' || type === 'registrationError' || type === 'localNotification',
      'PushNotificationIOS only supports `notification`, `register`, `registrationError`, and `localNotification` events'
    );
    var listener = _notifHandlers.get(type);
    if (!listener) {
      return;
    }
    listener.remove();
    _notifHandlers.delete(type);
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

   * This method returns a promise that will resolve when the user accepts,
   * rejects, or if the permissions were previously rejected. The promise
   * resolves to the current state of the permission.
   */
  static requestPermissions(permissions?: {
    alert?: boolean,
    badge?: boolean,
    sound?: boolean
  }): Promise<{
    alert: boolean,
    badge: boolean,
    sound: boolean
  }> {
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
    return RCTPushNotificationManager.requestPermissions(requestedPermissions);
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
   * This method returns a promise that resolves to either the notification
   * object if the app was launched by a push notification, or `null` otherwise.
   */
  static getInitialNotification(): Promise<?PushNotificationIOS> {
    return RCTPushNotificationManager.getInitialNotification().then(notification => {
      return notification && new PushNotificationIOS(notification);
    });
  }

  /**
   * You will never need to instantiate `PushNotificationIOS` yourself.
   * Listening to the `notification` event and invoking
   * `getInitialNotification` is sufficient
   */
  constructor(nativeNotif: Object) {
    this._data = {};
    this._remoteNotificationCompleteCalllbackCalled = false;
    this._isRemote = nativeNotif.remote;
    if (this._isRemote) {
      this._notificationId = nativeNotif.notificationId;
    }

    if (nativeNotif.remote) {
      // Extract data from Apple's `aps` dict as defined:
      // https://developer.apple.com/library/ios/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/Chapters/ApplePushService.html
      Object.keys(nativeNotif).forEach((notifKey) => {
        var notifVal = nativeNotif[notifKey];
        if (notifKey === 'aps') {
          this._alert = notifVal.alert;
          this._sound = notifVal.sound;
          this._badgeCount = notifVal.badge;
          this._category = notifVal.category;
        } else {
          this._data[notifKey] = notifVal;
        }
      });
    } else {
      // Local notifications aren't being sent down with `aps` dict.
      this._badgeCount = nativeNotif.applicationIconBadgeNumber;
      this._sound = nativeNotif.soundName;
      this._alert = nativeNotif.alertBody;
      this._data = nativeNotif.userInfo;
      this._category = nativeNotif.category;
    }
  }

  /**
   * This method is available for remote notifications that have been received via:
   * `application:didReceiveRemoteNotification:fetchCompletionHandler:`
   * https://developer.apple.com/library/ios/documentation/UIKit/Reference/UIApplicationDelegate_Protocol/#//apple_ref/occ/intfm/UIApplicationDelegate/application:didReceiveRemoteNotification:fetchCompletionHandler:
   *
   * Call this to execute when the remote notification handling is complete. When
   * calling this block, pass in the fetch result value that best describes
   * the results of your operation. You *must* call this handler and should do so
   * as soon as possible. For a list of possible values, see `PushNotificationIOS.FetchResult`.
   *
   * If you do not call this method your background remote notifications could
   * be throttled, to read more about it see the above documentation link.
   */
  finish(fetchResult: FetchResult) {
    if (!this._isRemote || !this._notificationId || this._remoteNotificationCompleteCalllbackCalled) {
      return;
    }
    this._remoteNotificationCompleteCalllbackCalled = true;

    RCTPushNotificationManager.onFinishRemoteNotification(this._notificationId, fetchResult);
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
   * Gets the category string from the `aps` object
   */
  getCategory(): ?string {
    return this._category;
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
