/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import android.app.Activity
import android.content.Intent

/**
 * Listener for receiving activity events. Consider using [BaseActivityEventListener] if you're not
 * interested in all the events sent to this interface.
 */
public interface ActivityEventListener {
  /** Called when host (activity/service) receives an [Activity.onActivityResult] call. */
  public fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?)

  /** Called when a new intent is passed to the activity. */
  public fun onNewIntent(intent: Intent)

  /** Called when host activity receives an [Activity.onUserLeaveHint] call. */
  public fun onUserLeaveHint(activity: Activity): Unit = Unit
}
