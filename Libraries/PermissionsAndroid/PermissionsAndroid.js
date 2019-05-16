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

const NativeModules = require('../BatchedBridge/NativeModules');
import NativePermissionsAndroid, {
  PERMISSION_REQUEST_RESULT,
  PERMISSIONS,
} from './NativePermissionsAndroid';

import type {
  PermissionStatus,
  PermissionType,
} from './NativePermissionsAndroid';

export type Rationale = {
  title: string,
  message: string,
  buttonPositive?: string,
  buttonNegative?: string,
  buttonNeutral?: string,
};

/**
 * `PermissionsAndroid` provides access to Android M's new permissions model.
 *
 * See https://facebook.github.io/react-native/docs/permissionsandroid.html
 */

class PermissionsAndroid {
  PERMISSIONS = PERMISSIONS;
  RESULTS = PERMISSION_REQUEST_RESULT;

  /**
   * DEPRECATED - use check
   *
   * Returns a promise resolving to a boolean value as to whether the specified
   * permissions has been granted
   *
   * @deprecated
   */
  checkPermission(permission: PermissionType): Promise<boolean> {
    console.warn(
      '"PermissionsAndroid.checkPermission" is deprecated. Use "PermissionsAndroid.check" instead',
    );
    return NativePermissionsAndroid.checkPermission(permission);
  }

  /**
   * Returns a promise resolving to a boolean value as to whether the specified
   * permissions has been granted
   *
   * See https://facebook.github.io/react-native/docs/permissionsandroid.html#check
   */
  check(permission: PermissionType): Promise<boolean> {
    return NativePermissionsAndroid.checkPermission(permission);
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
  async requestPermission(
    permission: PermissionType,
    rationale?: Rationale,
  ): Promise<boolean> {
    console.warn(
      '"PermissionsAndroid.requestPermission" is deprecated. Use "PermissionsAndroid.request" instead',
    );
    const response = await this.request(permission, rationale);
    return response === this.RESULTS.GRANTED;
  }

  /**
   * Prompts the user to enable a permission and returns a promise resolving to a
   * string value indicating whether the user allowed or denied the request
   *
   * See https://facebook.github.io/react-native/docs/permissionsandroid.html#request
   */
  async request(
    permission: PermissionType,
    rationale?: Rationale,
  ): Promise<PermissionStatus> {
    if (rationale) {
      const shouldShowRationale = await NativePermissionsAndroid.shouldShowRequestPermissionRationale(
        permission,
      );

      if (shouldShowRationale) {
        return new Promise((resolve, reject) => {
          NativeModules.DialogManagerAndroid.showAlert(
            rationale,
            () => reject(new Error('Error showing rationale')),
            () =>
              resolve(NativePermissionsAndroid.requestPermission(permission)),
          );
        });
      }
    }
    return NativePermissionsAndroid.requestPermission(permission);
  }

  /**
   * Prompts the user to enable multiple permissions in the same dialog and
   * returns an object with the permissions as keys and strings as values
   * indicating whether the user allowed or denied the request
   *
   * See https://facebook.github.io/react-native/docs/permissionsandroid.html#requestmultiple
   */
  requestMultiple(
    permissions: Array<PermissionType>,
  ): Promise<{[permission: PermissionType]: PermissionStatus}> {
    return NativePermissionsAndroid.requestMultiplePermissions(permissions);
  }
}

PermissionsAndroid = new PermissionsAndroid();

module.exports = PermissionsAndroid;
