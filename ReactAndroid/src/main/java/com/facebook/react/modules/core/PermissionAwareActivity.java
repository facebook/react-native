/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.core;

import android.app.Activity;

/**
 * Interface used to denote activities that can forward permission requests and call
 * {@link PermissionListener}s with the permission request results.
 */
public interface PermissionAwareActivity {

  /**
   * See {@link Activity#checkPermission}.
   */
  int checkPermission(String permission, int pid, int uid);

  /**
   * See {@link Activity#checkSelfPermission}.
   */
  int checkSelfPermission(String permission);

  /**
   * See {@link Activity#shouldShowRequestPermissionRationale}.
   */
  boolean shouldShowRequestPermissionRationale(String permission);

  /**
   * See {@link Activity#requestPermissions}.
   */
  void requestPermissions(String[] permissions, int requestCode, PermissionListener listener);
}
