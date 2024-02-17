/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import type {TurboModule} from '../../../../Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../../../Libraries/TurboModule/TurboModuleRegistry';

type Permissions = {|
  alert: boolean,
  badge: boolean,
  sound: boolean,
|};

type Notification = {|
  +alertTitle?: ?string,
  +alertBody?: ?string,
  +userInfo?: ?Object,
  /**
   * Identifier for the notification category. See the [Apple documentation](https://developer.apple.com/documentation/usernotifications/declaring_your_actionable_notification_types)
   * for more details.
   */
  +category?: ?string,
  /**
   * Actual type: string | number
   *
   * Schedule notifications using EITHER `fireDate` or `fireIntervalSeconds`.
   * If both are specified, `fireDate` takes precedence.
   * If you use `presentLocalNotification`, both will be ignored
   * and the notification will be shown immediately.
   */
  +fireDate?: ?number,
  /**
   * Seconds from now to display the notification.
   *
   * Schedule notifications using EITHER `fireDate` or `fireIntervalSeconds`.
   * If both are specified, `fireDate` takes precedence.
   * If you use `presentLocalNotification`, both will be ignored
   * and the notification will be shown immediately.
   */
  +fireIntervalSeconds?: ?number,
  /** Badge count to display on the app icon. */
  +applicationIconBadgeNumber?: ?number,
  /** Whether to silence the notification sound. */
  +isSilent?: ?boolean,
  /**
   * Custom notification sound. Can only be set when creating notifications.
   * This will be null for notifications retrieved via
   * getScheduledLocalNotifications or getDeliveredNotifications.
   */
  +soundName?: ?string,
  /** DEPRECATED. This was used for iOS's legacy UILocalNotification. */
  +alertAction?: ?string,
  /** DEPRECATED. Use `fireDate` or `fireIntervalSeconds` instead. */
  +repeatInterval?: ?string,
|};

export interface Spec extends TurboModule {
  +getConstants: () => {||};
  +onFinishRemoteNotification: (
    notificationId: string,
    /**
     * Type:
     *  'UIBackgroundFetchResultNewData' |
     *  'UIBackgroundFetchResultNoData' |
     *  'UIBackgroundFetchResultFailed'
     */
    fetchResult: string,
  ) => void;
  +setApplicationIconBadgeNumber: (num: number) => void;
  +getApplicationIconBadgeNumber: (callback: (num: number) => void) => void;
  +requestPermissions: (permission: {|
    +alert: boolean,
    +badge: boolean,
    +sound: boolean,
  |}) => Promise<Permissions>;
  +abandonPermissions: () => void;
  +checkPermissions: (callback: (permissions: Permissions) => void) => void;
  +presentLocalNotification: (notification: Notification) => void;
  +scheduleLocalNotification: (notification: Notification) => void;
  +cancelAllLocalNotifications: () => void;
  +cancelLocalNotifications: (userInfo: Object) => void;
  +getInitialNotification: () => Promise<?Notification>;
  +getScheduledLocalNotifications: (
    callback: (notification: Notification) => void,
  ) => void;
  +removeAllDeliveredNotifications: () => void;
  +removeDeliveredNotifications: (identifiers: Array<string>) => void;
  +getDeliveredNotifications: (
    callback: (notification: Array<Notification>) => void,
  ) => void;
  +getAuthorizationStatus: (
    callback: (authorizationStatus: number) => void,
  ) => void;
  +addListener: (eventType: string) => void;
  +removeListeners: (count: number) => void;
}

export default (TurboModuleRegistry.get<Spec>(
  'PushNotificationManager',
): ?Spec);
