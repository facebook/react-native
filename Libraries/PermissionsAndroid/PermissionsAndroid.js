/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule PermissionsAndroid
 * @flow
 */
'use strict';

const NativeModules = require('NativeModules');

type Rationale = {
  title: string,
  message: string,
}

type PermissionStatus = 'granted' | 'denied' | 'never_ask_again';
/**
 * <div class="banner-crna-ejected">
 *   <h3>Project with Native Code Required</h3>
 *   <p>
 *     This API only works in projects made with <code>react-native init</code>
 *     or in those made with Create React Native App which have since ejected. For
 *     more information about ejecting, please see
 *     the <a href="https://github.com/react-community/create-react-native-app/blob/master/EJECTING.md" target="_blank">guide</a> on
 *     the Create React Native App repository.
 *   </p>
 * </div>
 *
 * `PermissionsAndroid` provides access to Android M's new permissions model.
 * Some permissions are granted by default when the application is installed
 * so long as they appear in `AndroidManifest.xml`. However, "dangerous"
 * permissions require a dialog prompt. You should use this module for those
 * permissions.
 *
 * On devices before SDK version 23, the permissions are automatically granted
 * if they appear in the manifest, so `check` and `request`
 * should always be true.
 *
 * If a user has previously turned off a permission that you prompt for, the OS
 * will advise your app to show a rationale for needing the permission. The
 * optional `rationale` argument will show a dialog prompt only if
 * necessary - otherwise the normal permission prompt will appear.
 *
 * ### Example
 * ```
 * import { PermissionsAndroid } from 'react-native';
 *
 * async function requestCameraPermission() {
 *   try {
 *     const granted = await PermissionsAndroid.request(
 *       PermissionsAndroid.PERMISSIONS.CAMERA,
 *       {
 *         'title': 'Cool Photo App Camera Permission',
 *         'message': 'Cool Photo App needs access to your camera ' +
 *                    'so you can take awesome pictures.'
 *       }
 *     )
 *     if (granted === PermissionsAndroid.RESULTS.GRANTED) {
 *       console.log("You can use the camera")
 *     } else {
 *       console.log("Camera permission denied")
 *     }
 *   } catch (err) {
 *     console.warn(err)
 *   }
 * }
 * ```
 */

class PermissionsAndroid {
  PERMISSIONS: Object;
  RESULTS: Object;

  constructor() {
    /**
     * A list of specified "dangerous" permissions that require prompting the user
     */
    this.PERMISSIONS = {
      READ_CALENDAR: 'android.permission.READ_CALENDAR',
      WRITE_CALENDAR: 'android.permission.WRITE_CALENDAR',
      CAMERA: 'android.permission.CAMERA',
      READ_CONTACTS: 'android.permission.READ_CONTACTS',
      WRITE_CONTACTS: 'android.permission.WRITE_CONTACTS',
      GET_ACCOUNTS:  'android.permission.GET_ACCOUNTS',
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
      BODY_SENSORS:  'android.permission.BODY_SENSORS',
      SEND_SMS: 'android.permission.SEND_SMS',
      RECEIVE_SMS: 'android.permission.RECEIVE_SMS',
      READ_SMS: 'android.permission.READ_SMS',
      RECEIVE_WAP_PUSH: 'android.permission.RECEIVE_WAP_PUSH',
      RECEIVE_MMS: 'android.permission.RECEIVE_MMS',
      READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE',
      WRITE_EXTERNAL_STORAGE: 'android.permission.WRITE_EXTERNAL_STORAGE',
    };

    this.RESULTS = {
      GRANTED: 'granted',
      DENIED: 'denied',
      NEVER_ASK_AGAIN: 'never_ask_again',
    };
  }

  /**
   * DEPRECATED - use check
   *
   * Returns a promise resolving to a boolean value as to whether the specified
   * permissions has been granted
   *
   * @deprecated
   */
  checkPermission(permission: string) : Promise<boolean> {
    console.warn('"PermissionsAndroid.checkPermission" is deprecated. Use "PermissionsAndroid.check" instead');
    return NativeModules.PermissionsAndroid.checkPermission(permission);
  }

  /**
   * Returns a promise resolving to a boolean value as to whether the specified
   * permissions has been granted
   */
  check(permission: string) : Promise<boolean> {
    return NativeModules.PermissionsAndroid.checkPermission(permission);
  }

  /**
   * DEPRECATED - use request
   *
   * Prompts the user to enable a permission and returns a promise resolving to a
   * boolean value indicating whether the user allowed or denied the request
   *
   * If the optional rationale argument is included (which is an object with a
   * `title` and `message`), this function checks with the OS whether it is
   * necessary to show a dialog explaining why the permission is needed
   * (https://developer.android.com/training/permissions/requesting.html#explain)
   * and then shows the system permission dialog
   *
   * @deprecated
   */
  async requestPermission(permission: string, rationale?: Rationale) : Promise<boolean> {
    console.warn('"PermissionsAndroid.requestPermission" is deprecated. Use "PermissionsAndroid.request" instead');
    const response = await this.request(permission, rationale);
    return (response === this.RESULTS.GRANTED);
  }

  /**
   * Prompts the user to enable a permission and returns a promise resolving to a
   * string value indicating whether the user allowed or denied the request
   *
   * If the optional rationale argument is included (which is an object with a
   * `title` and `message`), this function checks with the OS whether it is
   * necessary to show a dialog explaining why the permission is needed
   * (https://developer.android.com/training/permissions/requesting.html#explain)
   * and then shows the system permission dialog
   */
  async request(permission: string, rationale?: Rationale) : Promise<PermissionStatus> {
    if (rationale) {
      const shouldShowRationale = await NativeModules.PermissionsAndroid.shouldShowRequestPermissionRationale(permission);

      if (shouldShowRationale) {
        return new Promise((resolve, reject) => {
          NativeModules.DialogManagerAndroid.showAlert(
            rationale,
            () => reject(new Error('Error showing rationale')),
            () => resolve(NativeModules.PermissionsAndroid.requestPermission(permission))
          );
        });
      }
    }
    return NativeModules.PermissionsAndroid.requestPermission(permission);
  }

  /**
   * Prompts the user to enable multiple permissions in the same dialog and
   * returns an object with the permissions as keys and strings as values
   * indicating whether the user allowed or denied the request
   */
  requestMultiple(permissions: Array<string>) : Promise<{[permission: string]: PermissionStatus}> {
    return NativeModules.PermissionsAndroid.requestMultiplePermissions(permissions);
  }
}

PermissionsAndroid = new PermissionsAndroid();

module.exports = PermissionsAndroid;
