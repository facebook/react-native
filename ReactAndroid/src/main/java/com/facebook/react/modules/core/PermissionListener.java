/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.core;

import android.app.Activity;

/**
 * Interface used by activities to delegate permission request results. Classes implementing this
 * class will be notified whenever there's a result for a permission request.
 */
public interface PermissionListener {

  /**
   * Method called whenever there's a result to a permission request. It is forwarded from
   * {@link Activity#onRequestPermissionsResult}.
   *
   * @return boolean Whether the PermissionListener can be removed.
   */
  boolean onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults);
}
