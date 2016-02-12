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

let lastNotificationId = 0;

type NotificationDetails = {
  title: string,
  body?: string;
  count?: number;
  sticky?: boolean;
}

class Notification {
  /**
   * Presents a local notification.
   *
   * details is an object containing:
   *
   * - `title` : The title of the notification.
   * - `body` : The body of the message in the notification (optional).
   * - `count` : The count to be displayed for the notification (optional).
   * - `sticky` : Whether the notification is sorted above the regular notifications and is unclosable (optional).
   */
  static presentLocalNotification(details: NotificationDetails): number {
      lastNotificationId++;
      NotificationModule.presentLocalNotification(details, lastNotificationId);
      return lastNotificationId;
  }

  /**
   * Cancels a specific local notifications.
   *
   * Takes the notification id as the argument, which was returned from `presentLocalNotification`.
   */
  static cancelLocalNotification(id: number) {
    NotificationModule.cancelLocalNotification(id);
  }

  /**
   * Cancels all local notifications.
   */
  static cancelAllLocalNotifications() {
    NotificationModule.cancelAllLocalNotifications();
  }
}

module.exports = Notification;
