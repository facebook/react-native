/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime

import com.facebook.jni.HybridData
import com.facebook.jni.annotations.DoNotStripAny
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.modules.core.JavaScriptTimerExecutor
import com.facebook.soloader.SoLoader

@DoNotStripAny
internal class JSTimerExecutor(private val mHybridData: HybridData) : JavaScriptTimerExecutor {

  private external fun callTimers(timerIDs: WritableNativeArray)

  override fun callTimers(timerIDs: WritableArray) {
    callTimers(timerIDs as WritableNativeArray)
  }

  override fun callIdleCallbacks(frameTime: Double) {
    // TODO T52558331
  }

  override fun emitTimeDriftWarning(warningMessage: String) {
    // TODO T52558331
  }

  private companion object {
    init {
      SoLoader.loadLibrary("rninstance")
    }
  }
}
