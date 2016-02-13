/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Notification
 * @flow
 */

'use strict';

const { NotificationModule } = require('NativeModules');
const Platform = require('Platform');
const invariant = require('invariant');

const NOTIFICATION_ID = 0;

type NotificationDetails = {
  body?: string;
  count?: number;
  priority?: string;
  sticky?: boolean;
  silent?: boolean;
  vibrate?: Array<number>;
  link?: string;
  tag?: string;
}

/**
 * `Notification` provides a way to manage local notifications for your app.
 *
 * ### Basic usage
 *
 * To show a new local notification, create a new `Notification` object,
 *
 * ```
 * const notification = new Notification('Test notification');
 *
 * // Close the notification after 5 seconds
 * setTimeout(() => notification.close(), 5000);
 * ```
 *
 * The `Notification` constructor takes two arguments, a `title` and an optional `details` object.
 *
 * The `details` object can contain the following properties:
 *
 * - `body (string)` : The body of the message in the notification (optional).
 * - `count (number)` : The count to be displayed for the notification (optional).
 * - `priority (max | high | default | low | min)` : Priority of the notification (optional).
 * - `sticky (boolean)` : Whether the notification is sorted above the regular notifications and is unclosable (optional).
 * - `silent (boolean)` : Whether the notification should not issue any sounds (optional).
 * - `vibrate` (Array<number>) : Vibration pattern to use, e.g. - (refer - https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API) (optional).
 * - `link (string)` : The link to open on tap on the notification (optional).
 * - `tag (string)` : A string identifier for the notification (optional).
 */
class Notification {
  /**
   * The current permission to display notifications
   */
  static permission: string;

  /**
   * Requests permission from the user to display notifications.
   *
   * @platform ios
   */
  static requestPermission() {
    console.warn('Notification.requestPermission() is currently not implemented');
  }

  /**
   * Closes all local notifications.
   *
   * @platform android
   */
  static closeAll() {
    NotificationModule.cancelAllLocalNotifications();
  }

  _id: number;
  _tag: ?string;

  /**
   * Creates a new local notification.
   *
   * returns the notification instance with a close method to close the notification.
   *
   * @platform android
   */
  constructor(title: string, details?: NotificationDetails) {
    invariant(
      typeof title === 'string',
      'Title must be a string'
    );

    NotificationModule.presentLocalNotification({ ...details, title }, NOTIFICATION_ID);
    this._id = NOTIFICATION_ID;
    this._tag = details ? details.tag : null;
  }

  /**
   * Closes the current local notification instance.
   *
   * @platform android
   */
  close() {
    NotificationModule.cancelLocalNotification(this._tag, this._id);
  }
}

Notification.permission = Platform.OS === 'android' ? 'granted' : 'default';

module.exports = Notification;
