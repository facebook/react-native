/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const NativeEventEmitter = require('../EventEmitter/NativeEventEmitter');
const RCTPushNotificationManager = require('../BatchedBridge/NativeModules')
  .PushNotificationManager;
const invariant = require('invariant');

const PushNotificationEmitter = new NativeEventEmitter(
  RCTPushNotificationManager,
);

const _notifHandlers = new Map();

const DEVICE_NOTIF_EVENT = 'remoteNotificationReceived';
const NOTIF_REGISTER_EVENT = 'remoteNotificationsRegistered';
const NOTIF_REGISTRATION_ERROR_EVENT = 'remoteNotificationRegistrationError';
const DEVICE_LOCAL_NOTIF_EVENT = 'localNotificationReceived';

export type ContentAvailable = 1 | null | void;

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
 *
 * Handle push notifications for your app, including permission handling and
 * icon badge number.
 *
 * See https://facebook.github.io/react-native/docs/pushnotificationios.html
 */
class PushNotificationIOS {
  _data: Object;
  _alert: string | Object;
  _sound: string;
  _category: string;
  _contentAvailable: ContentAvailable;
  _badgeCount: number;
  _notificationId: string;
  _isRemote: boolean;
  _remoteNotificationCompleteCallbackCalled: boolean;
  _threadID: string;

  static FetchResult: FetchResult = {
    NewData: 'UIBackgroundFetchResultNewData',
    NoData: 'UIBackgroundFetchResultNoData',
    ResultFailed: 'UIBackgroundFetchResultFailed',
  };

  /**
   * Schedules the localNotification for immediate presentation.
   *
   * See https://facebook.github.io/react-native/docs/pushnotificationios.html#presentlocalnotification
   */
  static presentLocalNotification(details: Object) {
    RCTPushNotificationManager.presentLocalNotification(details);
  }

  /**
   * Schedules the localNotification for future presentation.
   *
   * See https://facebook.github.io/react-native/docs/pushnotificationios.html#schedulelocalnotification
   */
  static scheduleLocalNotification(details: Object) {
    RCTPushNotificationManager.scheduleLocalNotification(details);
  }

  /**
   * Cancels all scheduled localNotifications.
   *
   * See https://facebook.github.io/react-native/docs/pushnotificationios.html#cancelalllocalnotifications
   */
  static cancelAllLocalNotifications() {
    RCTPushNotificationManager.cancelAllLocalNotifications();
  }

  /**
   * Remove all delivered notifications from Notification Center.
   *
   * See https://facebook.github.io/react-native/docs/pushnotificationios.html#removealldeliverednotifications
   */
  static removeAllDeliveredNotifications(): void {
    RCTPushNotificationManager.removeAllDeliveredNotifications();
  }

  /**
   * Provides you with a list of the app’s notifications that are still displayed in Notification Center.
   *
   * See https://facebook.github.io/react-native/docs/pushnotificationios.html#getdeliverednotifications
   */
  static getDeliveredNotifications(
    callback: (notifications: Array<Object>) => void,
  ): void {
    RCTPushNotificationManager.getDeliveredNotifications(callback);
  }

  /**
   * Removes the specified notifications from Notification Center
   *
   * See https://facebook.github.io/react-native/docs/pushnotificationios.html#removedeliverednotifications
   */
  static removeDeliveredNotifications(identifiers: Array<string>): void {
    RCTPushNotificationManager.removeDeliveredNotifications(identifiers);
  }

  /**
   * Sets the badge number for the app icon on the home screen.
   *
   * See https://facebook.github.io/react-native/docs/pushnotificationios.html#setapplicationiconbadgenumber
   */
  static setApplicationIconBadgeNumber(number: number) {
    RCTPushNotificationManager.setApplicationIconBadgeNumber(number);
  }

  /**
   * Gets the current badge number for the app icon on the home screen.
   *
   * See https://facebook.github.io/react-native/docs/pushnotificationios.html#getapplicationiconbadgenumber
   */
  static getApplicationIconBadgeNumber(callback: Function) {
    RCTPushNotificationManager.getApplicationIconBadgeNumber(callback);
  }

  /**
   * Cancel local notifications.
   *
   * See https://facebook.github.io/react-native/docs/pushnotificationios.html#cancellocalnotification
   */
  static cancelLocalNotifications(userInfo: Object) {
    RCTPushNotificationManager.cancelLocalNotifications(userInfo);
  }

  /**
   * Gets the local notifications that are currently scheduled.
   *
   * See https://facebook.github.io/react-native/docs/pushnotificationios.html#getscheduledlocalnotifications
   */
  static getScheduledLocalNotifications(callback: Function) {
    RCTPushNotificationManager.getScheduledLocalNotifications(callback);
  }

  /**
   * Attaches a listener to remote or local notification events while the app
   * is running in the foreground or the background.
   *
   * See https://facebook.github.io/react-native/docs/pushnotificationios.html#addeventlistener
   */
  static addEventListener(type: PushNotificationEventName, handler: Function) {
    invariant(
      type === 'notification' ||
        type === 'register' ||
        type === 'registrationError' ||
        type === 'localNotification',
      'PushNotificationIOS only supports `notification`, `register`, `registrationError`, and `localNotification` events',
    );
    let listener;
    if (type === 'notification') {
      listener = PushNotificationEmitter.addListener(
        DEVICE_NOTIF_EVENT,
        notifData => {
          handler(new PushNotificationIOS(notifData));
        },
      );
    } else if (type === 'localNotification') {
      listener = PushNotificationEmitter.addListener(
        DEVICE_LOCAL_NOTIF_EVENT,
        notifData => {
          handler(new PushNotificationIOS(notifData));
        },
      );
    } else if (type === 'register') {
      listener = PushNotificationEmitter.addListener(
        NOTIF_REGISTER_EVENT,
        registrationInfo => {
          handler(registrationInfo.deviceToken);
        },
      );
    } else if (type === 'registrationError') {
      listener = PushNotificationEmitter.addListener(
        NOTIF_REGISTRATION_ERROR_EVENT,
        errorInfo => {
          handler(errorInfo);
        },
      );
    }
    _notifHandlers.set(type, listener);
  }

  /**
   * Removes the event listener. Do this in `componentWillUnmount` to prevent
   * memory leaks.
   *
   * See https://facebook.github.io/react-native/docs/pushnotificationios.html#removeeventlistener
   */
  static removeEventListener(
    type: PushNotificationEventName,
    handler: Function,
  ) {
    invariant(
      type === 'notification' ||
        type === 'register' ||
        type === 'registrationError' ||
        type === 'localNotification',
      'PushNotificationIOS only supports `notification`, `register`, `registrationError`, and `localNotification` events',
    );
    const listener = _notifHandlers.get(type);
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
   *
   * See https://facebook.github.io/react-native/docs/pushnotificationios.html#requestpermissions
   */
  static requestPermissions(permissions?: {
    alert?: boolean,
    badge?: boolean,
    sound?: boolean,
  }): Promise<{
    alert: boolean,
    badge: boolean,
    sound: boolean,
  }> {
    let requestedPermissions = {};
    if (permissions) {
      requestedPermissions = {
        alert: !!permissions.alert,
        badge: !!permissions.badge,
        sound: !!permissions.sound,
      };
    } else {
      requestedPermissions = {
        alert: true,
        badge: true,
        sound: true,
      };
    }
    return RCTPushNotificationManager.requestPermissions(requestedPermissions);
  }

  /**
   * Unregister for all remote notifications received via Apple Push Notification service.
   *
   * See https://facebook.github.io/react-native/docs/pushnotificationios.html#abandonpermissions
   */
  static abandonPermissions() {
    RCTPushNotificationManager.abandonPermissions();
  }

  /**
   * See what push permissions are currently enabled. `callback` will be
   * invoked with a `permissions` object.
   *
   * See https://facebook.github.io/react-native/docs/pushnotificationios.html#checkpermissions
   */
  static checkPermissions(callback: Function) {
    invariant(typeof callback === 'function', 'Must provide a valid callback');
    RCTPushNotificationManager.checkPermissions(callback);
  }

  /**
   * This method returns a promise that resolves to either the notification
   * object if the app was launched by a push notification, or `null` otherwise.
   *
   * See https://facebook.github.io/react-native/docs/pushnotificationios.html#getinitialnotification
   */
  static getInitialNotification(): Promise<?PushNotificationIOS> {
    return RCTPushNotificationManager.getInitialNotification().then(
      notification => {
        return notification && new PushNotificationIOS(notification);
      },
    );
  }

  /**
   * You will never need to instantiate `PushNotificationIOS` yourself.
   * Listening to the `notification` event and invoking
   * `getInitialNotification` is sufficient
   *
   */
  constructor(nativeNotif: Object) {
    this._data = {};
    this._remoteNotificationCompleteCallbackCalled = false;
    this._isRemote = nativeNotif.remote;
    if (this._isRemote) {
      this._notificationId = nativeNotif.notificationId;
    }

    if (nativeNotif.remote) {
      // Extract data from Apple's `aps` dict as defined:
      // https://developer.apple.com/library/ios/documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/Chapters/ApplePushService.html
      Object.keys(nativeNotif).forEach(notifKey => {
        const notifVal = nativeNotif[notifKey];
        if (notifKey === 'aps') {
          this._alert = notifVal.alert;
          this._sound = notifVal.sound;
          this._badgeCount = notifVal.badge;
          this._category = notifVal.category;
          this._contentAvailable = notifVal['content-available'];
          this._threadID = notifVal['thread-id'];
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
   *
   * See https://facebook.github.io/react-native/docs/pushnotificationios.html#finish
   */
  finish(fetchResult: string) {
    if (
      !this._isRemote ||
      !this._notificationId ||
      this._remoteNotificationCompleteCallbackCalled
    ) {
      return;
    }
    this._remoteNotificationCompleteCallbackCalled = true;

    RCTPushNotificationManager.onFinishRemoteNotification(
      this._notificationId,
      fetchResult,
    );
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
   *
   * See https://facebook.github.io/react-native/docs/pushnotificationios.html#getsound
   */
  getSound(): ?string {
    return this._sound;
  }

  /**
   * Gets the category string from the `aps` object
   *
   * See https://facebook.github.io/react-native/docs/pushnotificationios.html#getcategory
   */
  getCategory(): ?string {
    return this._category;
  }

  /**
   * Gets the notification's main message from the `aps` object
   *
   * See https://facebook.github.io/react-native/docs/pushnotificationios.html#getalert
   */
  getAlert(): ?string | ?Object {
    return this._alert;
  }

  /**
   * Gets the content-available number from the `aps` object
   *
   * See https://facebook.github.io/react-native/docs/pushnotificationios.html#getcontentavailable
   */
  getContentAvailable(): ContentAvailable {
    return this._contentAvailable;
  }

  /**
   * Gets the badge count number from the `aps` object
   *
   * See https://facebook.github.io/react-native/docs/pushnotificationios.html#getbadgecount
   */
  getBadgeCount(): ?number {
    return this._badgeCount;
  }

  /**
   * Gets the data object on the notif
   *
   * See https://facebook.github.io/react-native/docs/pushnotificationios.html#getdata
   */
  getData(): ?Object {
    return this._data;
  }

  /**
   * Gets the thread ID on the notif
   *
   * See https://facebook.github.io/react-native/docs/pushnotificationios.html#getthreadid
   */
  getThreadID(): ?string {
    return this._threadID;
  }
}

module.exports = PushNotificationIOS;
