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

import type {TurboModule} from 'RCTExport';
import * as TurboModuleRegistry from 'TurboModuleRegistry';

export const PERMISSION_REQUEST_RESULT = Object.freeze({
  GRANTED: 'granted',
  DENIED: 'denied',
  NEVER_ASK_AGAIN: 'never_ask_again',
});

export const PERMISSIONS = Object.freeze({
  READ_CALENDAR: 'android.permission.READ_CALENDAR',
  WRITE_CALENDAR: 'android.permission.WRITE_CALENDAR',
  CAMERA: 'android.permission.CAMERA',
  READ_CONTACTS: 'android.permission.READ_CONTACTS',
  WRITE_CONTACTS: 'android.permission.WRITE_CONTACTS',
  GET_ACCOUNTS: 'android.permission.GET_ACCOUNTS',
  ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
  ACCESS_COARSE_LOCATION: 'android.permission.ACCESS_COARSE_LOCATION',
  RECORD_AUDIO: 'android.permission.RECORD_AUDIO',
  READ_PHONE_STATE: 'android.permission.READ_PHONE_STATE',
  CALL_PHONE: 'android.permission.CALL_PHONE',
  READ_CALL_LOG: 'android.permission.READ_CALL_LOG',
  WRITE_CALL_LOG: 'android.permission.WRITE_CALL_LOG',
  ADD_VOICEMAIL: 'com.android.voicemail.permission.ADD_VOICEMAIL',
  USE_SIP: 'android.permission.USE_SIP',
  PROCESS_OUTGOING_CALLS: 'android.permission.PROCESS_OUTGOING_CALLS',
  BODY_SENSORS: 'android.permission.BODY_SENSORS',
  SEND_SMS: 'android.permission.SEND_SMS',
  RECEIVE_SMS: 'android.permission.RECEIVE_SMS',
  READ_SMS: 'android.permission.READ_SMS',
  RECEIVE_WAP_PUSH: 'android.permission.RECEIVE_WAP_PUSH',
  RECEIVE_MMS: 'android.permission.RECEIVE_MMS',
  READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
  WRITE_EXTERNAL_STORAGE: 'android.permission.WRITE_EXTERNAL_STORAGE',
});

export type PermissionStatus = $Values<typeof PERMISSION_REQUEST_RESULT>;
export type PermissionType = $Values<typeof PERMISSIONS>;

export interface Spec extends TurboModule {
  +checkPermission: (permission: PermissionType) => Promise<boolean>;

  +requestPermission: (permission: PermissionType) => Promise<PermissionStatus>;

  +shouldShowRequestPermissionRationale: (
    permission: string,
  ) => Promise<boolean>;

  +requestMultiplePermissions: (
    permissions: Array<PermissionType>,
  ) => Promise<{[permission: PermissionType]: PermissionStatus}>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('PermissionsAndroid');
