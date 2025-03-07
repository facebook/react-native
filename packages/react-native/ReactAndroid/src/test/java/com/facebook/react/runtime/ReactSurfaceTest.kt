/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime

import android.app.Activity
import android.content.Context
import android.view.View
import com.facebook.react.bridge.NativeMap
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.interfaces.fabric.SurfaceHandler
import com.facebook.react.runtime.internal.bolts.Task
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.ArgumentMatchers.any
import org.mockito.invocation.InvocationOnMock
import org.mockito.kotlin.doReturn
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.shadows.ShadowInstrumentation

@RunWith(RobolectricTestRunner::class)
@OptIn(UnstableReactNativeAPI::class)
@Config(shadows = [ShadowSoLoader::class])
class ReactSurfaceTest {
  private lateinit var eventDispatcher: EventDispatcher
  private lateinit var reactHost: ReactHostImpl
  private lateinit var context: Context
  private lateinit var reactSurface: ReactSurfaceImpl
  private lateinit var surfaceHandler: TestSurfaceHandler

  @Before
  fun setUp() {
    eventDispatcher = mock()
    context = Robolectric.buildActivity(Activity::class.java).create().get()
    reactHost = mock()
    whenever(reactHost.startSurface(any())).thenAnswer(this::mockedStartSurface)
    whenever(reactHost.prerenderSurface(any())).thenAnswer(this::mockedStartSurface)
    whenever(reactHost.stopSurface(any())).thenAnswer(this::mockedStopSurface)
    whenever(reactHost.eventDispatcher).doReturn(eventDispatcher)
    surfaceHandler = TestSurfaceHandler()
    reactSurface = ReactSurfaceImpl(surfaceHandler, context)
    reactSurface.attachView(ReactSurfaceView(context, reactSurface))
  }

  @Test
  fun testAttach() {
    Assertions.assertThat(reactSurface.reactHost).isNull()
    reactSurface.attach(reactHost)
    Assertions.assertThat(reactSurface.reactHost).isEqualTo(reactHost)
    Assertions.assertThat(reactSurface.isAttached).isTrue()
  }

  @Test(expected = IllegalStateException::class)
  fun testAttachThrowException() {
    reactSurface.attach(reactHost)
    reactSurface.attach(reactHost)
  }

  @Test
  @Throws(InterruptedException::class)
  fun testPrerender() {
    reactSurface.attach(reactHost)
    val task = reactSurface.prerender() as Task<Void>
    task.waitForCompletion()
    verify(reactHost).prerenderSurface(reactSurface)
    Assertions.assertThat(surfaceHandler.isRunning).isTrue()
  }

  @Test
  @Throws(InterruptedException::class)
  fun testStart() {
    reactSurface.attach(reactHost)
    Assertions.assertThat(reactHost.isSurfaceAttached(reactSurface)).isFalse()
    val task = reactSurface.start() as Task<Void>
    task.waitForCompletion()
    verify(reactHost).startSurface(reactSurface)
    Assertions.assertThat(surfaceHandler.isRunning).isTrue()
  }

  @Test
  @Throws(InterruptedException::class)
  fun testStop() {
    reactSurface.attach(reactHost)
    var task = reactSurface.start() as Task<*>
    task.waitForCompletion()
    task = reactSurface.stop() as Task<*>
    task.waitForCompletion()
    verify(reactHost).stopSurface(reactSurface)
  }

  @Test
  fun testClear() {
    reactSurface.view!!.addView(View(context))
    reactSurface.clear()
    ShadowInstrumentation.getInstrumentation().waitForIdleSync()
    Assertions.assertThat(reactSurface.view!!.id).isEqualTo(View.NO_ID)
    Assertions.assertThat(reactSurface.view!!.childCount).isEqualTo(0)
  }

  @Test
  fun testGetLayoutSpecs() {
    val measureSpecWidth = Int.MAX_VALUE
    val measureSpecHeight = Int.MIN_VALUE
    Assertions.assertThat(surfaceHandler.widthMeasureSpec).isNotEqualTo(measureSpecWidth)
    Assertions.assertThat(surfaceHandler.heightMeasureSpec).isNotEqualTo(measureSpecHeight)
    reactSurface.attach(reactHost)
    reactSurface.updateLayoutSpecs(measureSpecWidth, measureSpecHeight, 2, 3)
    Assertions.assertThat(surfaceHandler.widthMeasureSpec).isEqualTo(measureSpecWidth)
    Assertions.assertThat(surfaceHandler.heightMeasureSpec).isEqualTo(measureSpecHeight)
  }

  @Test
  fun testGetEventDispatcher() {
    reactSurface.attach(reactHost)
    Assertions.assertThat(reactSurface.eventDispatcher).isEqualTo(eventDispatcher)
  }

  @Test
  @Throws(InterruptedException::class)
  fun testStartStopHandlerCalls() {
    reactSurface.attach(reactHost)
    Assertions.assertThat(reactSurface.isRunning).isFalse()
    var task = reactSurface.start() as Task<*>
    task.waitForCompletion()
    Assertions.assertThat(reactSurface.isRunning).isTrue()
    task = reactSurface.stop() as Task<*>
    task.waitForCompletion()
    Assertions.assertThat(reactSurface.isRunning).isFalse()
  }

  private fun mockedStartSurface(inv: InvocationOnMock): Task<Void> {
    surfaceHandler.start()
    return Task.forResult(null)
  }

  private fun mockedStopSurface(inv: InvocationOnMock): Task<Boolean> {
    surfaceHandler.stop()
    return Task.forResult(true)
  }

  internal class TestSurfaceHandler : SurfaceHandler {
    override var isRunning = false
    override val moduleName = "TestSurfaceHandler"
    override val surfaceId = 0

    var heightMeasureSpec = 0
    var widthMeasureSpec = 0

    fun start() {
      isRunning = true
    }

    fun stop() {
      isRunning = false
    }

    override fun setMountable(mountable: Boolean) {
      // no-op
    }

    override fun setLayoutConstraints(
        widthMeasureSpec: Int,
        heightMeasureSpec: Int,
        offsetX: Int,
        offsetY: Int,
        doLeftAndRightSwapInRTL: Boolean,
        isRTL: Boolean,
        pixelDensity: Float
    ) {
      this.widthMeasureSpec = widthMeasureSpec
      this.heightMeasureSpec = heightMeasureSpec
    }

    override fun setProps(props: NativeMap) {
      // no-op
    }
  }
}
