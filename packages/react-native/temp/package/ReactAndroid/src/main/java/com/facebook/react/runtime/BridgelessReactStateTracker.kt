/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime

import com.facebook.common.logging.FLog
import java.util.Collections

internal class BridgelessReactStateTracker(private val shouldTrackStates: Boolean) {
  private val states = Collections.synchronizedList(mutableListOf<String>())

  protected fun enterState(state: String) {
    FLog.w(TAG, state)
    if (shouldTrackStates) {
      states.add(state)
    }
  }

  private companion object {
    private const val TAG = "BridgelessReact"
  }
}
