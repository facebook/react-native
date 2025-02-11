/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// TODO T207169925: Migrate CatalystInstance to Reacthost and remove the Suppress("DEPRECATION")
// annotation
@file:Suppress("DEPRECATION")

package com.facebook.react.views.image

import android.graphics.Color
import android.util.DisplayMetrics
import com.facebook.common.logging.FLog
import com.facebook.drawee.backends.pipeline.Fresco
import com.facebook.drawee.drawable.ScalingUtils
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.bridge.CatalystInstance
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactTestHelper.createMockCatalystInstance
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.common.ReactConstants
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.util.RNLog
import com.facebook.react.views.imagehelper.ImageSource
import com.facebook.soloader.SoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.MockedStatic
import org.mockito.Mockito.any
import org.mockito.Mockito.anyString
import org.mockito.Mockito.mock
import org.mockito.Mockito.mockStatic
import org.mockito.Mockito.never
import org.mockito.Mockito.reset
import org.mockito.Mockito.verify
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

/** Verify that [ScalingUtils] properties are being applied correctly by [ReactImageManager]. */
@RunWith(RobolectricTestRunner::class)
class ReactImagePropertyTest {

  private lateinit var context: BridgeReactContext
  private lateinit var catalystInstanceMock: CatalystInstance
  private lateinit var themeContext: ThemedReactContext
  private lateinit var arguments: MockedStatic<Arguments>
  private lateinit var rnLog: MockedStatic<RNLog>
  private lateinit var flogMock: MockedStatic<FLog>

  @Before
  fun setup() {
    arguments = mockStatic(Arguments::class.java)
    arguments.`when`<WritableArray> { Arguments.createArray() }.thenAnswer { JavaOnlyArray() }
    arguments.`when`<WritableMap> { Arguments.createMap() }.thenAnswer { JavaOnlyMap() }

    rnLog = mockStatic(RNLog::class.java)
    rnLog.`when`<Boolean> { RNLog.w(any(), anyString()) }.thenAnswer {}

    flogMock = mockStatic(FLog::class.java)

    SoLoader.setInTestMode()
    context = BridgeReactContext(RuntimeEnvironment.getApplication())
    catalystInstanceMock = createMockCatalystInstance()
    context.initializeWithInstance(catalystInstanceMock)
    themeContext = ThemedReactContext(context, context, null, -1)
    Fresco.initialize(context)
    DisplayMetricsHolder.setWindowDisplayMetrics(DisplayMetrics())

    ReactNativeFeatureFlagsForTests.setUp()
  }

  @After
  fun teardown() {
    DisplayMetricsHolder.setWindowDisplayMetrics(null)
    arguments.close()
    rnLog.close()
    flogMock.close()
  }

  private fun buildStyles(vararg keysAndValues: Any?): ReactStylesDiffMap {
    return ReactStylesDiffMap(JavaOnlyMap.of(*keysAndValues))
  }

  @Test
  fun testAccessibilityFocus() {
    val viewManager = ReactImageManager()
    val view = viewManager.createViewInstance(themeContext)
    viewManager.setAccessible(view, true)
    assertThat(view.isFocusable).isTrue()
  }

  @Test
  fun testOverlayColor() {
    val viewManager = ReactImageManager()
    val mockView = mock(ReactImageView::class.java)

    viewManager.setOverlayColor(mockView, null)
    verify(mockView).setOverlayColor(Color.TRANSPARENT)
    reset(mockView)

    viewManager.setOverlayColor(mockView, Color.argb(50, 0, 0, 255))
    verify(mockView).setOverlayColor(Color.argb(50, 0, 0, 255))
    reset(mockView)
  }

  @Test
  fun testTintColor() {
    val viewManager = ReactImageManager()
    val view = viewManager.createViewInstance(themeContext)
    assertThat(view.colorFilter).isNull()
    viewManager.updateProperties(view, buildStyles("tintColor", Color.argb(50, 0, 0, 255)))
    // Can't actually assert the specific color so this is the next best thing.
    // Does the color filter now exist?
    assertThat(view.colorFilter).isNotNull()
    viewManager.updateProperties(view, buildStyles("tintColor", null))
    assertThat(view.colorFilter).isNull()
  }

  @Test
  fun testNullSrcs() {
    val viewManager = ReactImageManager()
    val view = viewManager.createViewInstance(themeContext)
    val sources = Arguments.createArray()
    val srcObj = Arguments.createMap()
    srcObj.putNull("uri")
    srcObj.putNull("width")
    srcObj.putNull("height")
    sources.pushMap(srcObj)
    viewManager.setSource(view, sources)
    view.maybeUpdateView()
    assertThat(ImageSource.getTransparentBitmapImageSource(view.context))
        .isEqualTo(view.imageSource)
  }

  @Test
  fun testResizeMode() {
    val viewManager = ReactImageManager()
    val mockView = mock(ReactImageView::class.java)

    viewManager.setResizeMode(mockView, null)
    verify(mockView).setScaleType(ScalingUtils.ScaleType.CENTER_CROP)
    reset(mockView)

    viewManager.setResizeMode(mockView, "cover")
    verify(mockView).setScaleType(ScalingUtils.ScaleType.CENTER_CROP)
    reset(mockView)

    viewManager.setResizeMode(mockView, "contain")
    verify(mockView).setScaleType(ScalingUtils.ScaleType.FIT_CENTER)
    reset(mockView)

    viewManager.setResizeMode(mockView, "stretch")
    verify(mockView).setScaleType(ScalingUtils.ScaleType.FIT_XY)
    reset(mockView)

    viewManager.setResizeMode(mockView, "repeat")
    verify(mockView).setScaleType(ScaleTypeStartInside.INSTANCE)
    reset(mockView)

    viewManager.setResizeMode(mockView, "center")
    verify(mockView).setScaleType(ScalingUtils.ScaleType.CENTER_INSIDE)
    reset(mockView)

    viewManager.setResizeMode(mockView, "invalid")
    verify(mockView).setScaleType(ScalingUtils.ScaleType.CENTER_CROP)
  }

  @Test
  fun testResizeMethod() {
    val viewManager = ReactImageManager()
    val mockView = mock(ReactImageView::class.java)

    viewManager.setResizeMethod(mockView, null)
    verify(mockView).setResizeMethod(ImageResizeMethod.AUTO)
    reset(mockView)

    viewManager.setResizeMethod(mockView, "auto")
    verify(mockView).setResizeMethod(ImageResizeMethod.AUTO)
    reset(mockView)

    viewManager.setResizeMethod(mockView, "resize")
    verify(mockView).setResizeMethod(ImageResizeMethod.RESIZE)
    reset(mockView)

    viewManager.setResizeMethod(mockView, "scale")
    verify(mockView).setResizeMethod(ImageResizeMethod.SCALE)
    reset(mockView)

    viewManager.setResizeMethod(mockView, "none")
    verify(mockView).setResizeMethod(ImageResizeMethod.NONE)
    reset(mockView)

    viewManager.setResizeMethod(mockView, "invalid")
    verify(mockView).setResizeMethod(ImageResizeMethod.AUTO)
    flogMock.verify { FLog.w(ReactConstants.TAG, "Invalid resize method: 'invalid'") }
  }

  @Test
  fun testResizeMultiplier() {
    val viewManager = ReactImageManager()
    val mockView = mock(ReactImageView::class.java)

    viewManager.setResizeMultiplier(mockView, 0.01f)
    verify(mockView).setResizeMultiplier(0.01f)
    reset(mockView)

    viewManager.setResizeMultiplier(mockView, 0.009f)
    verify(mockView).setResizeMultiplier(0.009f)
    flogMock.verify { FLog.w(ReactConstants.TAG, "Invalid resize multiplier: '0.009'") }
  }

  @Test
  fun testHeaders() {
    val viewManager = ReactImageManager()
    val mockView = mock(ReactImageView::class.java)

    viewManager.setHeaders(mockView, null)
    verify(mockView, never()).setHeaders(any())

    val headers = JavaOnlyMap()
    headers.putString("key", "value")
    viewManager.setHeaders(mockView, headers)
    verify(mockView).setHeaders(headers)
  }
}
