/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.bridge

import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStripAny
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger
import com.facebook.react.devsupport.inspector.InspectorNetworkRequestListener
import java.util.concurrent.Executor

@DoNotStripAny
@LegacyArchitecture
@Deprecated(
    message = "This class is part of Legacy Architecture and will be removed in a future release",
    level = DeprecationLevel.WARNING,
)
internal class ReactInstanceManagerInspectorTarget(delegate: TargetDelegate) : AutoCloseable {

  @DoNotStripAny
  public interface TargetDelegate {
    /** Android implementation for [HostTargetDelegate::getMetadata] */
    public fun getMetadata(): Map<String, String>

    /** Android implementation for [HostTargetDelegate::onReload] */
    public fun onReload()

    /** Android implementation for [HostTargetDelegate::onSetPausedInDebuggerMessage] */
    public fun onSetPausedInDebuggerMessage(message: String?)

    /** Android implementation for [HostTargetDelegate::loadNetworkResource] */
    public fun loadNetworkResource(url: String, listener: InspectorNetworkRequestListener)
  }

  @Suppress("NoHungarianNotation")
  private val mHybridData: HybridData =
      initHybrid(
          Executor { command ->
            if (UiThreadUtil.isOnUiThread()) {
              command.run()
            } else {
              UiThreadUtil.runOnUiThread(command)
            }
          },
          delegate,
      )

  private external fun initHybrid(executor: Executor, delegate: TargetDelegate): HybridData

  public external fun sendDebuggerResumeCommand()

  public override fun close() {
    mHybridData.resetNative()
  }

  @JvmName("isValid")
  internal fun isValid(): Boolean {
    return mHybridData.isValid
  }

  private companion object {
    init {
      LegacyArchitectureLogger.assertLegacyArchitecture(
          "ReactInstanceManagerInspectorTarget",
          LegacyArchitectureLogLevel.WARNING,
      )
      ReactNativeJNISoLoader.staticInit()
    }
  }
}
