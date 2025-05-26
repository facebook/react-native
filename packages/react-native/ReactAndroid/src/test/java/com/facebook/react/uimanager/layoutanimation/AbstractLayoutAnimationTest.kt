/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.layoutanimation

import android.view.View
import android.view.animation.AccelerateDecelerateInterpolator
import android.view.animation.AccelerateInterpolator
import android.view.animation.Animation
import android.view.animation.DecelerateInterpolator
import android.view.animation.LinearInterpolator
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.IllegalViewOperationException
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.After
import org.junit.Assert.assertThrows
import org.junit.Before
import org.junit.Test
import org.mockito.Mockito.mockConstruction
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever

class AbstractLayoutAnimationTest {
  private lateinit var view: View
  private lateinit var config: ReadableMap
  private lateinit var animation: AbstractLayoutAnimation
  private lateinit var mockedConstructors: List<AutoCloseable>

  @Before
  fun setUp() {
    view = mock()
    config = mock()

    mockedConstructors =
        listOf(
            mockConstruction(LinearInterpolator::class.java),
            mockConstruction(AccelerateInterpolator::class.java),
            mockConstruction(DecelerateInterpolator::class.java),
            mockConstruction(AccelerateDecelerateInterpolator::class.java),
        )

    animation =
        object : AbstractLayoutAnimation() {
          override fun isValid(): Boolean = true

          override fun createAnimationImpl(
              view: View,
              x: Int,
              y: Int,
              width: Int,
              height: Int
          ): Animation = mock()
        }
  }

  @After
  fun tearDown() {
    mockedConstructors.forEach { it.close() }
  }

  @Test
  fun reset_clearsAnimationProperties() {
    animation.reset()
    assertThat(animation.animatedProperty).isNull()
    assertThat(animation.durationMs).isEqualTo(0)
    assertThat(animation.delayMs).isEqualTo(0)
    assertThat(animation.interpolator).isNull()
  }

  @Test
  fun createAnimation_returnsValidAnimation() {
    val result = animation.createAnimation(view, 0, 0, 100, 100)
    assertThat(result).isNotNull
  }

  @Test
  fun initializeFromConfig_throwsIfTypeMissing() {
    whenever(config.hasKey("type")).thenReturn(false)

    val exception =
        assertThrows(IllegalArgumentException::class.java) {
          animation.initializeFromConfig(config, 300)
        }
    assertThat(exception.message).isEqualTo("Missing interpolation type.")
  }

  @Test
  fun createAnimation_returnsNullWhenInvalid() {
    val invalidAnimation =
        object : AbstractLayoutAnimation() {
          override fun isValid(): Boolean = false

          override fun createAnimationImpl(
              view: View,
              x: Int,
              y: Int,
              width: Int,
              height: Int
          ): Animation = mock()
        }

    val result = invalidAnimation.createAnimation(view, 0, 0, 100, 100)
    assertThat(result).isNull()
  }

  @Test
  fun initializeFromConfig_throwsIfInvalidAnimation() {
    whenever(config.hasKey("type")).thenReturn(true)
    whenever(config.getString("type")).thenReturn("linear")
    whenever(config.hasKey("duration")).thenReturn(true)
    whenever(config.getInt("duration")).thenReturn(300)

    val invalidAnimation =
        object : AbstractLayoutAnimation() {
          override fun isValid(): Boolean = false

          override fun createAnimationImpl(
              view: View,
              x: Int,
              y: Int,
              width: Int,
              height: Int
          ): Animation = mock()
        }

    assertThatThrownBy { invalidAnimation.initializeFromConfig(config, 300) }
        .isInstanceOf(IllegalViewOperationException::class.java)
        .hasMessageContaining("Invalid layout animation")
  }

  @Test
  fun getInterpolator_returnsSimpleSpringInterpolator() {
    val type = InterpolatorType.SPRING
    val params = mock<ReadableMap>()
    whenever(params.hasKey("damping")).thenReturn(true)
    whenever(params.getDouble("damping")).thenReturn(0.5)

    val interpolator = AbstractLayoutAnimation.getInterpolator(type, params)
    assertThat(interpolator).isInstanceOf(SimpleSpringInterpolator::class.java)
  }

  @Test
  fun getInterpolator_returnsDefaultInterpolator() {
    val type = InterpolatorType.LINEAR
    val params = mock<ReadableMap>()

    val interpolator = AbstractLayoutAnimation.getInterpolator(type, params)
    assertThat(interpolator).isInstanceOf(LinearInterpolator::class.java)
  }
}
