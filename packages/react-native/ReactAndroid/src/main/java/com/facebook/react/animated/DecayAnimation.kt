/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated

import com.facebook.react.bridge.ReadableMap
import kotlin.math.abs
import kotlin.math.exp

/**
 * Implementation of [AnimationDriver] providing support for decay animations. The implementation is
 * copied from the JS version in `AnimatedImplementation.js`.
 */
internal class DecayAnimation(config: ReadableMap) : AnimationDriver() {
  private var velocity: Double = 0.0
  private var deceleration: Double = 0.0
  private var startFrameTimeMillis: Long = -1
  private var fromValue: Double = 0.0
  private var lastValue: Double = 0.0
  private var iterations: Int = 1
  private var currentLoop: Int = 1

  init {
    resetConfig(config)
  }

  override fun resetConfig(config: ReadableMap): Unit {
    velocity = config.getDouble("velocity")
    deceleration = config.getDouble("deceleration")
    startFrameTimeMillis = -1
    fromValue = 0.0
    lastValue = 0.0
    iterations = if (config.hasKey("iterations")) config.getInt("iterations") else 1
    currentLoop = 1
    hasFinished = iterations == 0
  }

  override fun runAnimationStep(frameTimeNanos: Long) {
    val animatedValue = requireNotNull(animatedValue) { "Animated value should not be null" }
    val frameTimeMillis = frameTimeNanos / 1000000
    if (startFrameTimeMillis == -1L) {
      // since this is the first animation step, consider the start to be on the previous frame
      startFrameTimeMillis = frameTimeMillis - 16
      if (fromValue == lastValue) { // first iteration, assign [fromValue] based on [animatedValue]
        fromValue = animatedValue.nodeValue
      } else { // not the first iteration, reset [animatedValue] based on [fromValue]
        animatedValue.nodeValue = fromValue
      }
      lastValue = animatedValue.nodeValue
    }
    val value =
        (fromValue +
            velocity / (1 - deceleration) *
                (1 - exp(-(1 - deceleration) * (frameTimeMillis - startFrameTimeMillis))))
    if (abs(lastValue - value) < 0.1) {
      if (iterations == -1 || currentLoop < iterations) { // looping animation, return to start
        // set [startFrameTimeMillis] to -1 to reset instance variables on the next
        // [runAnimationStep]
        startFrameTimeMillis = -1
        currentLoop++
      } else { // animation has completed
        hasFinished = true
        return
      }
    }
    lastValue = value
    animatedValue.nodeValue = value
  }
}
