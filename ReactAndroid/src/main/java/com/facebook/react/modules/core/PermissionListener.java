/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.core;

import android.app.Activity;

/**
 * Interface used by activities to delegate permission request results. Classes implementing this
 * class will be notified whenever there's a result for a permission request.
 */
public interface PermissionListener {

  /**
   * Method called whenever there's a result to a permission request. It is forwarded from {@link
   * Activity#onRequestPermissionsResult}.
   *
   * @return boolean Whether the PermissionListener can be removed.
   */
  boolean onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults);
}
