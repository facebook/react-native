/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.timing

import android.view.Choreographer.FrameCallback
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.CatalystInstance
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableArray
import com.facebook.react.common.SystemClock
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.modules.core.JSTimers
import com.facebook.react.modules.core.ReactChoreographer
import com.facebook.react.modules.core.ReactChoreographer.CallbackType
import com.facebook.react.modules.core.TimingModule
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.ArgumentMatchers.any
import org.mockito.ArgumentMatchers.eq
import org.mockito.MockedStatic
import org.mockito.Mockito.mock
import org.mockito.Mockito.mockStatic
import org.mockito.Mockito.reset
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoMoreInteractions
import org.mockito.Mockito.`when` as whenever
import org.mockito.invocation.InvocationOnMock
import org.mockito.stubbing.Answer
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class TimingModuleTest {
  companion object {
    const val FRAME_TIME_NS = 17 * 1000 * 1000
  }

  private lateinit var timingModule: TimingModule
  private lateinit var reactChoreographerMock: ReactChoreographer
  private lateinit var postFrameCallbackHandler: PostFrameCallbackHandler
  private lateinit var idlePostFrameCallbackHandler: PostFrameCallbackHandler
  private var currentTimeNs = 0L
  private lateinit var jSTimersMock: JSTimers
  private lateinit var arguments: MockedStatic<Arguments>
  private lateinit var systemClock: MockedStatic<SystemClock>
  private lateinit var reactChoreographer: MockedStatic<ReactChoreographer>

  @Before
  fun prepareModules() {
    arguments = mockStatic(Arguments::class.java)
    arguments.`when`<WritableArray> { Arguments.createArray() }.thenAnswer { JavaOnlyArray() }

    systemClock = mockStatic(SystemClock::class.java)
    systemClock
        .`when`<Long> { SystemClock.uptimeMillis() }
        .thenAnswer {
          return@thenAnswer currentTimeNs / 1000000
        }
    systemClock
        .`when`<Long> { SystemClock.currentTimeMillis() }
        .thenAnswer {
          return@thenAnswer currentTimeNs / 1000000
        }
    systemClock
        .`when`<Long> { SystemClock.nanoTime() }
        .thenAnswer {
          return@thenAnswer currentTimeNs
        }

    reactChoreographerMock = mock(ReactChoreographer::class.java)
    reactChoreographer = mockStatic(ReactChoreographer::class.java)
    reactChoreographer
        .`when`<ReactChoreographer> { ReactChoreographer.getInstance() }
        .thenAnswer { reactChoreographerMock }

    val reactInstance = mock(CatalystInstance::class.java)
    val reactContext = mock(ReactApplicationContext::class.java)
    whenever(reactContext.catalystInstance).thenReturn(reactInstance)
    whenever(reactContext.hasActiveReactInstance()).thenReturn(true)

    postFrameCallbackHandler = PostFrameCallbackHandler()
    idlePostFrameCallbackHandler = PostFrameCallbackHandler()

    whenever(
            reactChoreographerMock.postFrameCallback(
                eq(CallbackType.TIMERS_EVENTS), any(FrameCallback::class.java)))
        .thenAnswer {
          return@thenAnswer postFrameCallbackHandler.answer(it)
        }

    whenever(
            reactChoreographerMock.postFrameCallback(
                eq(CallbackType.IDLE_EVENT), any(FrameCallback::class.java)))
        .thenAnswer {
          return@thenAnswer idlePostFrameCallbackHandler.answer(it)
        }

    timingModule = TimingModule(reactContext, mock(DevSupportManager::class.java))
    jSTimersMock = mock(JSTimers::class.java)
    whenever(reactContext.getJSModule(JSTimers::class.java)).thenReturn(jSTimersMock)
    whenever(reactContext.runOnJSQueueThread(any(Runnable::class.java))).thenAnswer { invocation ->
      (invocation.arguments[0] as Runnable).run()
      return@thenAnswer true
    }

    timingModule.initialize()
  }

  @After
  fun tearDown() {
    systemClock.close()
    arguments.close()
    reactChoreographer.close()
  }

  private fun stepChoreographerFrame() {
    val callback = postFrameCallbackHandler.getAndResetFrameCallback()
    val idleCallback = idlePostFrameCallbackHandler.getAndResetFrameCallback()
    currentTimeNs += FRAME_TIME_NS
    whenever(SystemClock.uptimeMillis()).thenAnswer {
      return@thenAnswer currentTimeNs / 1000000
    }
    callback?.doFrame(currentTimeNs)
    idleCallback?.doFrame(currentTimeNs)
  }

  @Test
  fun testSimpleTimer() {
    timingModule.onHostResume()
    timingModule.createTimer(1.0, 1.0, 0.0, false)
    stepChoreographerFrame()
    verify(jSTimersMock).callTimers(JavaOnlyArray.of(1.0))
    reset(jSTimersMock)
    stepChoreographerFrame()
    verifyNoMoreInteractions(jSTimersMock)
  }

  @Test
  fun testSimpleRecurringTimer() {
    timingModule.createTimer(100.0, 1.0, 0.0, true)
    timingModule.onHostResume()
    stepChoreographerFrame()
    verify(jSTimersMock).callTimers(JavaOnlyArray.of(100.0))
    reset(jSTimersMock)
    stepChoreographerFrame()
    verify(jSTimersMock).callTimers(JavaOnlyArray.of(100.0))
  }

  @Test
  fun testCancelRecurringTimer() {
    timingModule.onHostResume()
    timingModule.createTimer(105.0, 1.0, 0.0, true)
    stepChoreographerFrame()
    verify(jSTimersMock).callTimers(JavaOnlyArray.of(105.0))
    reset(jSTimersMock)
    timingModule.deleteTimer(105.0)
    stepChoreographerFrame()
    verifyNoMoreInteractions(jSTimersMock)
  }

  @Test
  fun testPausingAndResuming() {
    timingModule.onHostResume()
    timingModule.createTimer(41.0, 1.0, 0.0, true)
    stepChoreographerFrame()
    verify(jSTimersMock).callTimers(JavaOnlyArray.of(41.0))
    reset(jSTimersMock)
    timingModule.onHostPause()
    stepChoreographerFrame()
    verifyNoMoreInteractions(jSTimersMock)
    reset(jSTimersMock)
    timingModule.onHostResume()
    stepChoreographerFrame()
    verify(jSTimersMock).callTimers(JavaOnlyArray.of(41.0))
  }

  @Test
  fun testHeadlessJsTaskInBackground() {
    timingModule.onHostPause()
    timingModule.onHeadlessJsTaskStart(42)
    timingModule.createTimer(41.0, 1.0, 0.0, true)
    stepChoreographerFrame()
    verify(jSTimersMock).callTimers(JavaOnlyArray.of(41.0))
    reset(jSTimersMock)
    timingModule.onHeadlessJsTaskFinish(42)
    stepChoreographerFrame()
    verifyNoMoreInteractions(jSTimersMock)
  }

  @Test
  fun testHeadlessJsTaskInForeground() {
    timingModule.onHostResume()
    timingModule.onHeadlessJsTaskStart(42)
    timingModule.createTimer(41.0, 1.0, 0.0, true)
    stepChoreographerFrame()
    verify(jSTimersMock).callTimers(JavaOnlyArray.of(41.0))
    reset(jSTimersMock)
    timingModule.onHeadlessJsTaskFinish(42)
    stepChoreographerFrame()
    verify(jSTimersMock).callTimers(JavaOnlyArray.of(41.0))
    reset(jSTimersMock)
    timingModule.onHostPause()
    verifyNoMoreInteractions(jSTimersMock)
  }

  @Test
  fun testHeadlessJsTaskIntertwine() {
    timingModule.onHostResume()
    timingModule.onHeadlessJsTaskStart(42)
    timingModule.createTimer(41.0, 1.0, 0.0, true)
    timingModule.onHostPause()
    stepChoreographerFrame()
    verify(jSTimersMock).callTimers(JavaOnlyArray.of(41.0))
    reset(jSTimersMock)
    timingModule.onHostResume()
    timingModule.onHeadlessJsTaskFinish(42)
    stepChoreographerFrame()
    verify(jSTimersMock).callTimers(JavaOnlyArray.of(41.0))
    reset(jSTimersMock)
    timingModule.onHostPause()
    stepChoreographerFrame()
    verifyNoMoreInteractions(jSTimersMock)
  }

  @Test
  fun testSetTimeoutZero() {
    timingModule.createTimer(100.0, 0.0, 0.0, false)
    verify(jSTimersMock).callTimers(JavaOnlyArray.of(100.0))
  }

  @Test
  fun testActiveTimersInRange() {
    timingModule.onHostResume()
    assertThat(timingModule.hasActiveTimersInRange(100)).isFalse
    timingModule.createTimer(41.0, 1.0, 0.0, true)
    assertThat(timingModule.hasActiveTimersInRange(100)).isFalse // Repeating
    timingModule.createTimer(42.0, 150.0, 0.0, false)
    assertThat(timingModule.hasActiveTimersInRange(100)).isFalse // Out of range
    assertThat(timingModule.hasActiveTimersInRange(200)).isTrue // In range
  }

  @Test
  fun testIdleCallback() {
    timingModule.setSendIdleEvents(true)
    timingModule.onHostResume()
    stepChoreographerFrame()
    verify(jSTimersMock).callIdleCallbacks(SystemClock.currentTimeMillis().toDouble())
  }

  private class PostFrameCallbackHandler : Answer<Unit> {

    private var frameCallback: FrameCallback? = null

    override fun answer(invocation: InvocationOnMock) {
      invocation.arguments[1]?.let { frameCallback = it as FrameCallback }
    }

    fun getAndResetFrameCallback(): FrameCallback? {
      val callback = frameCallback
      frameCallback = null
      return callback
    }
  }
}
