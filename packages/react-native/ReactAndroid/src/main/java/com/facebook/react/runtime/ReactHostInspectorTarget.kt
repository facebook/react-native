/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime

import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStripAny
import com.facebook.react.runtime.internal.bolts.Task
import com.facebook.soloader.SoLoader
import java.io.Closeable
import java.util.concurrent.Executor

@DoNotStripAny
internal class ReactHostInspectorTarget(private val reactHostImpl: ReactHostImpl) : Closeable {
  // fbjni looks for the exact name "mHybridData":
  // https://github.com/facebookincubator/fbjni/blob/5587a7fd2b191656be9391a3832ce04c034009a5/cxx/fbjni/detail/Hybrid.h#L310
  @Suppress("NoHungarianNotation")
  private val mHybridData: HybridData =
      initHybrid(reactHostImpl, Task.UI_THREAD_CONDITIONAL_SYNC_EXECUTOR)

  private external fun initHybrid(reactHostImpl: ReactHostImpl, executor: Executor): HybridData

  override fun close() {
    mHybridData.resetNative()
  }

  private companion object {
    init {
      SoLoader.loadLibrary("rninstance")
    }
  }
}
