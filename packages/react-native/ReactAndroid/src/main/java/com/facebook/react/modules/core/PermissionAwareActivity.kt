/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.core

import android.app.Activity

/**
 * Interface used to denote activities that can forward permission requests and call
 * [PermissionListener] with the permission request results.
 */
public interface PermissionAwareActivity {
  /** See [Activity.checkPermission]. */
  public fun checkPermission(permission: String, pid: Int, uid: Int): Int

  /** See [Activity.checkSelfPermission]. */
  public fun checkSelfPermission(permission: String): Int

  /** See [Activity.shouldShowRequestPermissionRationale]. */
  public fun shouldShowRequestPermissionRationale(permission: String): Boolean

  /** See [Activity.requestPermissions]. */
  public fun requestPermissions(
      permissions: Array<String>,
      requestCode: Int,
      listener: PermissionListener?,
  )
}
