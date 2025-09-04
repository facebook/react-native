/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime

import com.facebook.common.logging.FLog

internal class ReactHostStateTracker(private val id: Int) {

  fun enterState(method: String, message: String? = null) {
    if (message == null) {
      FLog.w(TAG, "ReactHost{%d}.%s", id, method)
    } else {
      FLog.w(TAG, "ReactHost{%d}.%s: %s", id, method, message)
    }
  }

  private companion object {
    private const val TAG = "BridgelessReact"
  }
}
