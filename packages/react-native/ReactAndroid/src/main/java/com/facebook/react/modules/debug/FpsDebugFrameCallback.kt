/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.debug

import android.view.Choreographer
import com.facebook.infer.annotation.Assertions
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.build.ReactBuildConfig
import com.facebook.react.uimanager.UIManagerModule
import java.util.TreeMap

/**
 * Each time a frame is drawn, records whether it should have expected any more callbacks since the
 * last time a frame was drawn (i.e. was a frame skipped?). Uses this plus total elapsed time to
 * determine FPS. Can also record total and expected frame counts, though NB, since the expected
 * frame rate is estimated, the expected frame count will lose accuracy over time.
 *
 * Also records the JS FPS, i.e. the frames per second with which either JS updated the UI or was
 * idle and not trying to update the UI. This is different from the FPS above since JS rendering is
 * async.
 */
public class FpsDebugFrameCallback(private val reactContext: ReactContext) :
    Choreographer.FrameCallback {
  public class FpsInfo(
      public val totalFrames: Int,
      public val totalJsFrames: Int,
      public val totalExpectedFrames: Int,
      public val total4PlusFrameStutters: Int,
      public val fps: Double,
      public val jsFps: Double,
      public val totalTimeMs: Int
  )

  private var choreographer: Choreographer? = null
  private val didJSUpdateUiDuringFrameDetector: DidJSUpdateUiDuringFrameDetector =
      DidJSUpdateUiDuringFrameDetector()
  private var firstFrameTime: Long = -1
  private var lastFrameTime: Long = -1
  private var numFrameCallbacks = 0
  private var expectedNumFramesPrev = 0
  private var fourPlusFrameStutters = 0
  private var numFrameCallbacksWithBatchDispatches = 0
  private var isRecordingFpsInfoAtEachFrame = false
  private var targetFps = DEFAULT_FPS
  private var timeToFps: TreeMap<Long, FpsInfo>? = null

  override fun doFrame(l: Long) {
    if (firstFrameTime == -1L) {
      firstFrameTime = l
    }
    val lastFrameStartTime = lastFrameTime
    lastFrameTime = l
    if (didJSUpdateUiDuringFrameDetector.getDidJSHitFrameAndCleanup(lastFrameStartTime, l)) {
      numFrameCallbacksWithBatchDispatches++
    }
    numFrameCallbacks++
    val expectedNumFrames = expectedNumFrames
    val framesDropped = expectedNumFrames - expectedNumFramesPrev - 1
    if (framesDropped >= 4) {
      fourPlusFrameStutters++
    }
    if (isRecordingFpsInfoAtEachFrame) {
      Assertions.assertNotNull(timeToFps)
      val info =
          FpsInfo(
              numFrames,
              numJSFrames,
              expectedNumFrames,
              fourPlusFrameStutters,
              fps,
              jsFPS,
              totalTimeMS)
      timeToFps?.put(System.currentTimeMillis(), info)
    }
    expectedNumFramesPrev = expectedNumFrames
    choreographer?.postFrameCallback(this)
  }

  @JvmOverloads
  public fun start(targetFps: Double = this.targetFps) {
    // T172641976: re-think if we need to implement addBridgeIdleDebugListener and
    // removeBridgeIdleDebugListener for Bridgeless
    @Suppress("DEPRECATION")
    if (!ReactBuildConfig.UNSTABLE_ENABLE_MINIFY_LEGACY_ARCHITECTURE) {
      val uiManagerModule = reactContext.getNativeModule(UIManagerModule::class.java)
      if (!reactContext.isBridgeless) {
        reactContext.catalystInstance.addBridgeIdleDebugListener(didJSUpdateUiDuringFrameDetector)
      }
      uiManagerModule?.setViewHierarchyUpdateDebugListener(didJSUpdateUiDuringFrameDetector)
    }
    this.targetFps = targetFps
    UiThreadUtil.runOnUiThread {
      choreographer = Choreographer.getInstance()
      choreographer?.postFrameCallback(this)
    }
  }

  public fun startAndRecordFpsAtEachFrame() {
    timeToFps = TreeMap()
    isRecordingFpsInfoAtEachFrame = true
    start()
  }

  public fun stop() {
    @Suppress("DEPRECATION")
    if (!ReactBuildConfig.UNSTABLE_ENABLE_MINIFY_LEGACY_ARCHITECTURE) {
      val uiManagerModule = reactContext.getNativeModule(UIManagerModule::class.java)
      if (!reactContext.isBridgeless) {
        reactContext.catalystInstance.removeBridgeIdleDebugListener(
            didJSUpdateUiDuringFrameDetector)
      }
      uiManagerModule?.setViewHierarchyUpdateDebugListener(null)
    }
    UiThreadUtil.runOnUiThread {
      choreographer = Choreographer.getInstance()
      choreographer?.removeFrameCallback(this)
    }
  }

  public val fps: Double
    get() =
        if (lastFrameTime == firstFrameTime) {
          0.0
        } else numFrames.toDouble() * 1e9 / (lastFrameTime - firstFrameTime)

  public val jsFPS: Double
    get() =
        if (lastFrameTime == firstFrameTime) {
          0.0
        } else numJSFrames.toDouble() * 1e9 / (lastFrameTime - firstFrameTime)

  public val numFrames: Int
    get() = numFrameCallbacks - 1

  public val numJSFrames: Int
    get() = numFrameCallbacksWithBatchDispatches - 1

  public val expectedNumFrames: Int
    get() {
      val totalTimeMS = totalTimeMS.toDouble()
      return (targetFps * totalTimeMS / 1000 + 1).toInt()
    }

  public fun get4PlusFrameStutters(): Int = fourPlusFrameStutters

  public val totalTimeMS: Int
    get() = ((lastFrameTime.toDouble() - firstFrameTime) / 1000000.0).toInt()

  /**
   * Returns the FpsInfo as if stop had been called at the given upToTimeMs. Only valid if
   * monitoring was started with [.startAndRecordFpsAtEachFrame].
   */
  public fun getFpsInfo(upToTimeMs: Long): FpsInfo? {
    Assertions.assertNotNull(timeToFps, "FPS was not recorded at each frame!")
    val (_, value) = timeToFps?.floorEntry(upToTimeMs) ?: return null
    return value
  }

  public fun reset() {
    firstFrameTime = -1
    lastFrameTime = -1
    numFrameCallbacks = 0
    fourPlusFrameStutters = 0
    numFrameCallbacksWithBatchDispatches = 0
    isRecordingFpsInfoAtEachFrame = false
    timeToFps = null
  }

  private companion object {
    private const val DEFAULT_FPS = 60.0
  }
}
