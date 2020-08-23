/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict
 */

'use strict';

import type {TurboModule} from '../TurboModule/RCTExport';
import * as TurboModuleRegistry from '../TurboModule/TurboModuleRegistry';

// TODO: Use proper enum types.
export type PermissionStatus = string;
export type PermissionType = string;
/*
export type PermissionStatus = 'granted' | 'denied' | 'never_ask_again';
export type PermissionType =
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
  | 'android.permission.USE_SIP'
  | 'android.permission.PROCESS_OUTGOING_CALLS'
  | 'android.permission.BODY_SENSORS'
  | 'android.permission.SEND_SMS'
  | 'android.permission.RECEIVE_SMS'
  | 'android.permission.READ_SMS'
  | 'android.permission.RECEIVE_WAP_PUSH'
  | 'android.permission.RECEIVE_MMS'
  | 'android.permission.READ_EXTERNAL_STORAGE'
  | 'android.permission.WRITE_EXTERNAL_STORAGE';
*/

export interface Spec extends TurboModule {
  +checkPermission: (permission: PermissionType) => Promise<boolean>;
  +requestPermission: (permission: PermissionType) => Promise<PermissionStatus>;
  +shouldShowRequestPermissionRationale: (
    permission: string,
  ) => Promise<boolean>;
  +requestMultiplePermissions: (
    permissions: Array<PermissionType>,
  ) => Promise<{[permission: PermissionType]: PermissionStatus, ...}>;
}

export default (TurboModuleRegistry.get<Spec>('PermissionsAndroid'): ?Spec);
