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
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.CatalystInstance
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactTestHelper.createMockCatalystInstance
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.util.RNLog
import com.facebook.react.views.imagehelper.ImageSource
import com.facebook.soloader.SoLoader
import org.junit.After
import org.junit.Assert
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.powermock.api.mockito.PowerMockito
import org.powermock.core.classloader.annotations.PowerMockIgnore
import org.powermock.core.classloader.annotations.PrepareForTest
import org.powermock.modules.junit4.rule.PowerMockRule
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

/** Verify that [ScalingUtils] properties are being applied correctly by [ ]. */
@PrepareForTest(Arguments::class, RNLog::class)
@RunWith(RobolectricTestRunner::class)
@PowerMockIgnore("org.mockito.*", "org.robolectric.*", "androidx.*", "android.*")
class ReactImagePropertyTest {

  @get:Rule var rule = PowerMockRule()

  private var context: ReactApplicationContext? = null
  private var catalystInstanceMock: CatalystInstance? = null
  private var themeContext: ThemedReactContext? = null

  @Before
  fun setup() {
    PowerMockito.mockStatic(Arguments::class.java)
    PowerMockito.`when`(Arguments.createArray()).thenAnswer { JavaOnlyArray() }
    PowerMockito.`when`(Arguments.createMap()).thenAnswer { JavaOnlyMap() }

    // RNLog is stubbed out and the whole class need to be mocked
    PowerMockito.mockStatic(RNLog::class.java)
    SoLoader.setInTestMode()
    context = ReactApplicationContext(RuntimeEnvironment.getApplication())
    catalystInstanceMock = createMockCatalystInstance()
    context!!.initializeWithInstance(catalystInstanceMock)
    themeContext = ThemedReactContext(context, context)
    Fresco.initialize(context)
    DisplayMetricsHolder.setWindowDisplayMetrics(DisplayMetrics())
  }

  @After
  fun teardown() {
    DisplayMetricsHolder.setWindowDisplayMetrics(null)
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
