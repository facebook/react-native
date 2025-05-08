/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime

import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStripAny
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.soloader.SoLoader
import java.io.Closeable
import java.util.concurrent.Executor

@DoNotStripAny
internal class ReactHostInspectorTarget(reactHostImpl: ReactHostImpl) : Closeable {
  // fbjni looks for the exact name "mHybridData":
  // https://github.com/facebookincubator/fbjni/blob/5587a7fd2b191656be9391a3832ce04c034009a5/cxx/fbjni/detail/Hybrid.h#L310
  @Suppress("NoHungarianNotation")
  private val mHybridData: HybridData = initHybrid(reactHostImpl, UIThreadConditionalSyncExecutor())

  private external fun initHybrid(reactHostImpl: ReactHostImpl, executor: Executor): HybridData

  external fun sendDebuggerResumeCommand()

  override fun close() {
    mHybridData.resetNative()
  }

  fun isValid(): Boolean {
    return mHybridData.isValid()
  }

  private companion object {
    init {
      SoLoader.loadLibrary("rninstance")
    }
  }

  /**
   * An [java.util.concurrent.Executor] that runs tasks on the UI thread (immediately if already on
   * that thread).
   */
  private class UIThreadConditionalSyncExecutor : Executor {
    override fun execute(command: Runnable) {
      if (UiThreadUtil.isOnUiThread()) {
        // If we're already on the main thread, execute the command immediately
        command.run()
      } else {
        // Otherwise, post it on the main thread handler
        UiThreadUtil.runOnUiThread(command)
      }
    }
  }
}
