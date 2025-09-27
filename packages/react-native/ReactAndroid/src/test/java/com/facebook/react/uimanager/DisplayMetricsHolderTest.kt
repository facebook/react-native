/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.annotation.TargetApi
import android.app.Activity
import android.content.Context
import android.util.DisplayMetrics
import android.view.View
import android.view.Window
import android.view.WindowInsets
import com.facebook.react.bridge.WritableMap
import com.facebook.testutils.shadows.ShadowNativeLoader
import com.facebook.testutils.shadows.ShadowNativeMap
import com.facebook.testutils.shadows.ShadowReadableNativeMap
import com.facebook.testutils.shadows.ShadowSoLoader
import com.facebook.testutils.shadows.ShadowWritableNativeMap
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.ArgumentMatchers.anyInt
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(
    shadows =
        [
            ShadowSoLoader::class,
            ShadowNativeLoader::class,
            ShadowNativeMap::class,
            ShadowWritableNativeMap::class,
            ShadowReadableNativeMap::class,
        ]
)
class DisplayMetricsHolderTest {

  private lateinit var context: Context
  private lateinit var displayMetrics: DisplayMetrics

  @Before
  fun setUp() {
    context = RuntimeEnvironment.getApplication()
    displayMetrics = context.resources.displayMetrics
    DisplayMetricsHolder.setWindowDisplayMetrics(null)
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
  }

  @After
  fun tearDown() {
    DisplayMetricsHolder.setWindowDisplayMetrics(null)
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
  }

  @Test(expected = IllegalStateException::class)
  fun getWindowDisplayMetrics_failsIfDisplayMetricsIsNotInitialized() {
    DisplayMetricsHolder.getWindowDisplayMetrics()
  }

  @Test(expected = IllegalStateException::class)
  fun getScreenDisplayMetrics_failsIfDisplayMetricsIsNotInitialized() {
    DisplayMetricsHolder.getScreenDisplayMetrics()
  }

  @Test
  fun setAndGetWindowDisplayMetrics_returnsSetValue() {
    DisplayMetricsHolder.setWindowDisplayMetrics(displayMetrics)
    val result = DisplayMetricsHolder.getWindowDisplayMetrics()
    assertThat(result).isEqualTo(displayMetrics)
  }

  @Test
  fun setAndGetScreenDisplayMetrics_returnsSetValue() {
    DisplayMetricsHolder.setScreenDisplayMetrics(displayMetrics)
    val result = DisplayMetricsHolder.getScreenDisplayMetrics()
    assertThat(result).isEqualTo(displayMetrics)
  }

  @Test
  fun initDisplayMetrics_setsMetrics() {
    DisplayMetricsHolder.initDisplayMetrics(context)
    assertThat(DisplayMetricsHolder.getWindowDisplayMetrics()).isNotNull()
    assertThat(DisplayMetricsHolder.getScreenDisplayMetrics()).isNotNull()
  }

  @Test
  fun initDisplayMetricsIfNotInitialized_onlyInitializesOnce() {
    DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(context)
    val firstWindow = DisplayMetricsHolder.getWindowDisplayMetrics()
    val firstScreen = DisplayMetricsHolder.getScreenDisplayMetrics()
    // Should not reinitialize
    DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(context)
    val secondWindow = DisplayMetricsHolder.getWindowDisplayMetrics()
    val secondScreen = DisplayMetricsHolder.getScreenDisplayMetrics()
    assertThat(secondWindow).isEqualTo(firstWindow)
    assertThat(secondScreen).isEqualTo(firstScreen)
  }

  @Test(expected = IllegalStateException::class)
  fun getDisplayMetricsWritableMap_failsIfNotInitialized() {
    DisplayMetricsHolder.getDisplayMetricsWritableMap(1.0)
  }

  @Test
  fun getDisplayMetricsWritableMap_returnsCorrectMap() {
    // Use the official initialization method to ensure both metrics are set
    DisplayMetricsHolder.initDisplayMetrics(context)
    val map: WritableMap = DisplayMetricsHolder.getDisplayMetricsWritableMap(1.0)
    assertThat(map.hasKey("windowPhysicalPixels")).isTrue()
    assertThat(map.hasKey("screenPhysicalPixels")).isTrue()
    val windowMap = map.getMap("windowPhysicalPixels")
    val screenMap = map.getMap("screenPhysicalPixels")
    checkNotNull(windowMap)
    checkNotNull(screenMap)
    assertThat(windowMap.hasKey("width")).isTrue()
    assertThat(windowMap.hasKey("height")).isTrue()
    assertThat(windowMap.hasKey("scale")).isTrue()
    assertThat(windowMap.hasKey("fontScale")).isTrue()
    assertThat(windowMap.hasKey("densityDpi")).isTrue()
  }

  @Test
  @TargetApi(30)
  fun getEncodedScreenSizeWithoutVerticalInsets_returnsEncodedValue() {
    DisplayMetricsHolder.initDisplayMetrics(context)

    val activity: Activity = mock()
    val window: Window = mock()
    val decorView: View = mock()
    val windowInsets: WindowInsets = mock()
    whenever(activity.window).thenReturn(window)
    whenever(window.decorView).thenReturn(decorView)

    whenever(decorView.rootWindowInsets).thenReturn(windowInsets)
    whenever(windowInsets.getInsets(anyInt()))
        .thenReturn(android.graphics.Insets.of(10, 20, 10, 20))

    // Should return a non-zero encoded value
    val encoded = DisplayMetricsHolder.getEncodedScreenSizeWithoutVerticalInsets(activity)
    assertThat(encoded).isNotZero()
  }

  @Test
  fun getEncodedScreenSizeWithoutVerticalInsets_returnsZeroIfActivityIsNull() {
    val encoded = DisplayMetricsHolder.getEncodedScreenSizeWithoutVerticalInsets(null)
    assertThat(encoded).isZero()
  }

  @Test
  fun encodeFloatsToLong_encodesWidthAndHeightCorrectly() {
    val width = 123.45f
    val height = 67.89f
    val encoded = DisplayMetricsHolder.encodeFloatsToLong(width, height)
    val decodedWidth = Float.fromBits((encoded shr 32).toInt())
    val decodedHeight = Float.fromBits(encoded.toInt())
    assertThat(decodedWidth).isEqualTo(width)
    assertThat(decodedHeight).isEqualTo(height)
  }
}
