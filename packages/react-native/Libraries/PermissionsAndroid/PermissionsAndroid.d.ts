/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

export interface Rationale {
  title: string;
  message: string;
  buttonPositive: string;
  buttonNegative?: string | undefined;
  buttonNeutral?: string | undefined;
}

export type Permission =
  | 'android.permission.READ_CALENDAR'
  | 'android.permission.WRITE_CALENDAR'
  | 'android.permission.CAMERA'
  | 'android.permission.READ_CONTACTS'
  | 'android.permission.WRITE_CONTACTS'
  | 'android.permission.GET_ACCOUNTS'
  | 'android.permission.ACCESS_BACKGROUND_LOCATION'
  | 'android.permission.ACCESS_FINE_LOCATION'
  | 'android.permission.ACCESS_COARSE_LOCATION'
  | 'android.permission.RECORD_AUDIO'
  | 'android.permission.READ_PHONE_STATE'
  | 'android.permission.CALL_PHONE'
  | 'android.permission.READ_CALL_LOG'
  | 'android.permission.WRITE_CALL_LOG'
  | 'com.android.voicemail.permission.ADD_VOICEMAIL'
  | 'com.android.voicemail.permission.READ_VOICEMAIL'
  | 'com.android.voicemail.permission.WRITE_VOICEMAIL'
  | 'android.permission.USE_SIP'
  | 'android.permission.PROCESS_OUTGOING_CALLS'
  | 'android.permission.BODY_SENSORS'
  | 'android.permission.BODY_SENSORS_BACKGROUND'
  | 'android.permission.SEND_SMS'
  | 'android.permission.RECEIVE_SMS'
  | 'android.permission.READ_SMS'
  | 'android.permission.RECEIVE_WAP_PUSH'
  | 'android.permission.RECEIVE_MMS'
  | 'android.permission.READ_EXTERNAL_STORAGE'
  | 'android.permission.READ_MEDIA_IMAGES'
  | 'android.permission.READ_MEDIA_VIDEO'
  | 'android.permission.READ_MEDIA_AUDIO'
  | 'android.permission.WRITE_EXTERNAL_STORAGE'
  | 'android.permission.BLUETOOTH_CONNECT'
  | 'android.permission.BLUETOOTH_SCAN'
  | 'android.permission.BLUETOOTH_ADVERTISE'
  | 'android.permission.ACCESS_MEDIA_LOCATION'
  | 'android.permission.ACCEPT_HANDOVER'
  | 'android.permission.ACTIVITY_RECOGNITION'
  | 'android.permission.ANSWER_PHONE_CALLS'
  | 'android.permission.READ_PHONE_NUMBERS'
  | 'android.permission.UWB_RANGING'
  | 'android.permission.POST_NOTIFICATIONS'
  | 'android.permission.NEARBY_WIFI_DEVICES';

export type PermissionStatus = 'granted' | 'denied' | 'never_ask_again';

export interface PermissionsAndroidStatic {
  /**
   * A list of permission results that are returned
   */
  RESULTS: {[key: string]: PermissionStatus};
  /**
   * A list of specified "dangerous" permissions that require prompting the user
   */
  PERMISSIONS: {[key: string]: Permission};
  new (): PermissionsAndroidStatic;
  /**
   * @deprecated Use check instead
   */
  checkPermission(permission: Permission): Promise<boolean>;
  /**
   * Returns a promise resolving to a boolean value as to whether the specified
   * permissions has been granted
   */
  check(permission: Permission): Promise<boolean>;
  /**
   * @deprecated Use request instead
   */
  requestPermission(
    permission: Permission,
    rationale?: Rationale,
  ): Promise<boolean>;
  /**
   * Prompts the user to enable a permission and returns a promise resolving to a
   * string value indicating whether the user allowed or denied the request
   *
   * If the optional rationale argument is included (which is an object with a
   * title and message), this function checks with the OS whether it is necessary
   * to show a dialog explaining why the permission is needed
   * (https://developer.android.com/training/permissions/requesting.html#explain)
   * and then shows the system permission dialog
   */
  request(
    permission: Permission,
    rationale?: Rationale,
  ): Promise<PermissionStatus>;
  /**
   * Prompts the user to enable multiple permissions in the same dialog and
   * returns an object with the permissions as keys and strings as values
   * indicating whether the user allowed or denied the request
   */
  requestMultiple(
    permissions: Array<Permission>,
  ): Promise<{[key in Permission]: PermissionStatus}>;
}

export const PermissionsAndroid: PermissionsAndroidStatic;
export type PermissionsAndroid = PermissionsAndroidStatic;
