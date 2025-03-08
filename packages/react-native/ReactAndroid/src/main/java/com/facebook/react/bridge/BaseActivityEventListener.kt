/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import android.app.Activity
import android.content.Intent

/** An empty implementation of [ActivityEventListener]. */
public class BaseActivityEventListener : ActivityEventListener {
  @Deprecated("Use onActivityResult(Activity, Int, Int, Intent) instead.")
  public fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent) {}

  override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {}

  override fun onNewIntent(intent: Intent) {}
}
