/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.image

import android.graphics.Color
import android.util.DisplayMetrics
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
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.util.RNLog
import com.facebook.react.views.imagehelper.ImageSource
import com.facebook.soloader.SoLoader
import org.junit.After
import org.junit.Assert
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.MockedStatic
import org.mockito.Mockito.any
import org.mockito.Mockito.anyString
import org.mockito.Mockito.mockStatic
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

/** Verify that [ScalingUtils] properties are being applied correctly by [ReactImageManager]. */
@RunWith(RobolectricTestRunner::class)
class ReactImagePropertyTest {

  private var context: BridgeReactContext? = null
  private var catalystInstanceMock: CatalystInstance? = null
  private var themeContext: ThemedReactContext? = null
  private lateinit var arguments: MockedStatic<Arguments>
  private lateinit var rnLog: MockedStatic<RNLog>

  @Before
  fun setup() {
    arguments = mockStatic(Arguments::class.java)
    arguments.`when`<WritableArray> { Arguments.createArray() }.thenAnswer { JavaOnlyArray() }
    arguments.`when`<WritableMap> { Arguments.createMap() }.thenAnswer { JavaOnlyMap() }

    rnLog = mockStatic(RNLog::class.java)
    rnLog.`when`<Boolean> { RNLog.w(any(), anyString()) }.thenAnswer {}

    SoLoader.setInTestMode()
    context = BridgeReactContext(RuntimeEnvironment.getApplication())
    catalystInstanceMock = createMockCatalystInstance()
    context!!.initialize(catalystInstanceMock)
    themeContext = ThemedReactContext(context, context, null, -1)
    Fresco.initialize(context)
    DisplayMetricsHolder.setWindowDisplayMetrics(DisplayMetrics())
  }

  @After
  fun teardown() {
    DisplayMetricsHolder.setWindowDisplayMetrics(null)
    arguments.close()
    rnLog.close()
  }

  private fun buildStyles(vararg keysAndValues: Any?): ReactStylesDiffMap {
    return ReactStylesDiffMap(JavaOnlyMap.of(*keysAndValues))
  }

  @Test
  fun testBorderColor() {
    val viewManager = ReactImageManager()
    val view = viewManager.createViewInstance(themeContext!!)
    viewManager.updateProperties(
        view,
        buildStyles("src", JavaOnlyArray.of(JavaOnlyMap.of("uri", "http://mysite.com/mypic.jpg"))))
    viewManager.updateProperties(view, buildStyles("borderColor", Color.argb(0, 0, 255, 255)))
    var borderColor = view.hierarchy.roundingParams!!.borderColor
    Assert.assertEquals(0, Color.alpha(borderColor).toLong())
    Assert.assertEquals(0, Color.red(borderColor).toLong())
    Assert.assertEquals(255, Color.green(borderColor).toLong())
    Assert.assertEquals(255, Color.blue(borderColor).toLong())
    viewManager.updateProperties(view, buildStyles("borderColor", Color.argb(0, 255, 50, 128)))
    borderColor = view.hierarchy.roundingParams!!.borderColor
    Assert.assertEquals(0, Color.alpha(borderColor).toLong())
    Assert.assertEquals(255, Color.red(borderColor).toLong())
    Assert.assertEquals(50, Color.green(borderColor).toLong())
    Assert.assertEquals(128, Color.blue(borderColor).toLong())
    viewManager.updateProperties(view, buildStyles("borderColor", null))
    borderColor = view.hierarchy.roundingParams!!.borderColor
    Assert.assertEquals(0, Color.alpha(borderColor).toLong())
    Assert.assertEquals(0, Color.red(borderColor).toLong())
    Assert.assertEquals(0, Color.green(borderColor).toLong())
    Assert.assertEquals(0, Color.blue(borderColor).toLong())
  }

  @Test
  fun testRoundedCorners() {
    val viewManager = ReactImageManager()
    val view = viewManager.createViewInstance(themeContext!!)
    viewManager.updateProperties(
        view,
        buildStyles("src", JavaOnlyArray.of(JavaOnlyMap.of("uri", "http://mysite.com/mypic.jpg"))))

    // We can't easily verify if rounded corner was honored or not, this tests simply verifies
    // we're not crashing..
    viewManager.updateProperties(view, buildStyles("borderRadius", 10.0))
    viewManager.updateProperties(view, buildStyles("borderRadius", 0.0))
    viewManager.updateProperties(view, buildStyles("borderRadius", null))
  }

  @Test
  fun testAccessibilityFocus() {
    val viewManager = ReactImageManager()
    val view = viewManager.createViewInstance(themeContext!!)
    viewManager.setAccessible(view, true)
    Assert.assertEquals(true, view.isFocusable)
  }

  @Test
  fun testTintColor() {
    val viewManager = ReactImageManager()
    val view = viewManager.createViewInstance(themeContext!!)
    Assert.assertNull(view.colorFilter)
    viewManager.updateProperties(view, buildStyles("tintColor", Color.argb(50, 0, 0, 255)))
    // Can't actually assert the specific color so this is the next best thing.
    // Does the color filter now exist?
    Assert.assertNotNull(view.colorFilter)
    viewManager.updateProperties(view, buildStyles("tintColor", null))
    Assert.assertNull(view.colorFilter)
  }

  @Test
  fun testNullSrcs() {
    val viewManager = ReactImageManager()
    val view = viewManager.createViewInstance(themeContext!!)
    val sources = Arguments.createArray()
    val srcObj = Arguments.createMap()
    srcObj.putNull("uri")
    srcObj.putNull("width")
    srcObj.putNull("height")
    sources.pushMap(srcObj)
    viewManager.setSource(view, sources)
    view.maybeUpdateView()
    Assert.assertEquals(ImageSource.getTransparentBitmapImageSource(view.context), view.imageSource)
  }
}
