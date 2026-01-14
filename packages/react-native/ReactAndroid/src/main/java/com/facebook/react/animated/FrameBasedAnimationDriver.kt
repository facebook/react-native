/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated

import android.content.Context
import android.graphics.Color
import com.facebook.common.logging.FLog
import com.facebook.react.bridge.ColorPropConverter
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.common.ReactConstants
import com.facebook.react.common.build.ReactBuildConfig

/**
 * Implementation of [AnimationDriver] which provides a support for simple time-based animations
 * that are pre-calculate on the JS side. For each animation frame JS provides a value from 0 to 1
 * that indicates a progress of the animation at that frame.
 */
internal class FrameBasedAnimationDriver(
    config: ReadableMap,
    private val reactApplicationContext: ReactApplicationContext,
) : AnimationDriver() {
  private var startFrameTimeNanos: Long = -1
  private var frames: DoubleArray = DoubleArray(0)
  private var toValue: Double = 0.0
  private var fromValue = 0.0
  private var iterations = 1
  private var currentLoop = 1
  private var logCount = 0

  private val context: Context?
    get() {
      // There are cases where the activity may not exist (such as for VRShell panel apps). In this
      // case we will search for a view associated with a PropsAnimatedNode to get the context.
      return reactApplicationContext.currentActivity
          ?: AnimatedNode.getContextHelper(requireNotNull(animatedValue))
    }

  init {
    resetConfig(config)
  }

  override fun resetConfig(config: ReadableMap) {
    config.getArray("frames")?.let { framesConfig ->
      val numberOfFrames = framesConfig.size()
      if (frames.size != numberOfFrames) {
        frames = DoubleArray(numberOfFrames) { i -> framesConfig.getDouble(i) }
      }
    }

    toValue =
        when {
          !config.hasKey("toValue") -> 0.0
          config.getType("toValue") == ReadableType.Number -> config.getDouble("toValue")
          config.getType("toValue") == ReadableType.Map -> {
            val toValueMap = config.getMap("toValue")
            if (
                toValueMap != null &&
                    toValueMap.hasKey("nativeColor") &&
                    toValueMap.hasKey("channel")
            ) {
              // Handle platform color with channel information
              val nativeColorMap = toValueMap.getMap("nativeColor")
              val channel = toValueMap.getString("channel")
              val resolvedColor = context?.let { ColorPropConverter.getColor(nativeColorMap, it) }
              when {
                resolvedColor == null || channel == null -> 0.0
                channel == "r" -> Color.red(resolvedColor).toDouble()
                channel == "g" -> Color.green(resolvedColor).toDouble()
                channel == "b" -> Color.blue(resolvedColor).toDouble()
                channel == "a" -> Color.alpha(resolvedColor) / 255.0
                else -> 0.0
              }
            } else {
              0.0
            }
          }
          else -> 0.0
        }

    iterations =
        if (config.hasKey("iterations") && config.getType("iterations") == ReadableType.Number)
            config.getInt("iterations")
        else 1
    currentLoop = 1
    hasFinished = iterations == 0
    startFrameTimeNanos = -1
  }

  override fun runAnimationStep(frameTimeNanos: Long) {
    val animatedValue = requireNotNull(animatedValue) { "Animated value should not be null" }
    if (startFrameTimeNanos < 0) {
      startFrameTimeNanos = frameTimeNanos
      if (currentLoop == 1) {
        // initiate start value when animation runs for the first time
        fromValue = animatedValue.nodeValue
      }
    }
    val timeFromStartMillis = (frameTimeNanos - startFrameTimeNanos) / 1000000
    val frameIndex = Math.round(timeFromStartMillis / FRAME_TIME_MILLIS).toInt()
    if (frameIndex < 0) {
      val message =
          ("Calculated frame index should never be lower than 0. Called with frameTimeNanos " +
              frameTimeNanos +
              " and mStartFrameTimeNanos " +
              startFrameTimeNanos)
      check(!ReactBuildConfig.DEBUG) { message }
      if (logCount < 100) {
        FLog.w(ReactConstants.TAG, message)
        logCount++
      }
      return
    } else if (hasFinished) {
      // nothing to do here
      return
    }
    val nextValue: Double
    if (frameIndex >= frames.size - 1) {
      if (iterations == -1 || currentLoop < iterations) {
        // Use last frame value, just in case it's different from mToValue
        nextValue = fromValue + frames[frames.size - 1] * (toValue - fromValue)
        startFrameTimeNanos = -1
        currentLoop++
      } else {
        // animation has completed, no more frames left
        nextValue = toValue
        hasFinished = true
      }
    } else {
      nextValue = fromValue + frames[frameIndex] * (toValue - fromValue)
    }
    animatedValue.nodeValue = nextValue
  }

  companion object {
    // 60FPS
    private const val FRAME_TIME_MILLIS = 1000.0 / 60.0
  }
}
