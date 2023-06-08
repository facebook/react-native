package com.facebook.react.modules.timing

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.CatalystInstance
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.common.SystemClock
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.modules.core.ChoreographerCompat.FrameCallback
import com.facebook.react.modules.core.JSTimers
import com.facebook.react.modules.core.ReactChoreographer
import com.facebook.react.modules.core.ReactChoreographer.CallbackType
import com.facebook.react.modules.core.TimingModule
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Ignore
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.ArgumentMatchers.any
import org.mockito.ArgumentMatchers.eq
import org.mockito.Mockito.doAnswer
import org.mockito.Mockito.mock
import org.mockito.Mockito.reset
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoMoreInteractions
import org.mockito.Mockito.`when` as whenever
import org.mockito.invocation.InvocationOnMock
import org.mockito.stubbing.Answer
import org.powermock.api.mockito.PowerMockito
import org.powermock.core.classloader.annotations.PowerMockIgnore
import org.powermock.core.classloader.annotations.PrepareForTest
import org.powermock.modules.junit4.rule.PowerMockRule
import org.robolectric.RobolectricTestRunner

@PrepareForTest(Arguments::class, SystemClock::class, ReactChoreographer::class)
@PowerMockIgnore("org.mockito.*", "org.robolectric.*", "androidx.*", "android.*")
@RunWith(RobolectricTestRunner::class)
class TimingModuleTest {
  companion object {
    const val FRAME_TIME_NS = 17 * 1000 * 1000
  }

  private lateinit var timingModule: TimingModule
  private lateinit var reactChoreographerMock: ReactChoreographer
  private lateinit var postFrameCallbackHandler: PostFrameCallbackHandler
  private lateinit var idlePostFrameCallbackHandler: PostFrameCallbackHandler
  private var mCurrentTimeNs = 0L
  private lateinit var mJSTimersMock: JSTimers

  @get:Rule val powerMockRule = PowerMockRule()

  @Before
  fun prepareModules() {
    PowerMockito.mockStatic(Arguments::class.java)
    whenever(Arguments.createArray()).thenAnswer {
      return@thenAnswer JavaOnlyArray()
    }

    PowerMockito.mockStatic(SystemClock::class.java)
    whenever(SystemClock.uptimeMillis()).thenAnswer {
      return@thenAnswer mCurrentTimeNs / 1000000
    }
    whenever(SystemClock.currentTimeMillis()).thenAnswer {
      return@thenAnswer mCurrentTimeNs / 1000000
    }
    whenever(SystemClock.nanoTime()).thenAnswer {
      return@thenAnswer mCurrentTimeNs
    }

    reactChoreographerMock = mock(ReactChoreographer::class.java)
    PowerMockito.mockStatic(ReactChoreographer::class.java)
    whenever(ReactChoreographer.getInstance()).thenAnswer { reactChoreographerMock }

    val reactInstance = mock(CatalystInstance::class.java)
    val reactContext = mock(ReactApplicationContext::class.java)
    whenever(reactContext.catalystInstance).thenReturn(reactInstance)
    whenever(reactContext.hasActiveReactInstance()).thenReturn(true)

    postFrameCallbackHandler = PostFrameCallbackHandler()
    idlePostFrameCallbackHandler = PostFrameCallbackHandler()

    doAnswer(postFrameCallbackHandler)
      .`when`(reactChoreographerMock)
      .postFrameCallback(eq(CallbackType.TIMERS_EVENTS), any(FrameCallback::class.java))

    doAnswer(idlePostFrameCallbackHandler)
      .`when`(reactChoreographerMock)
      .postFrameCallback(eq(CallbackType.IDLE_EVENT), any(FrameCallback::class.java))

    timingModule = TimingModule(reactContext, mock(DevSupportManager::class.java))
    mJSTimersMock = mock(JSTimers::class.java)
    whenever(reactContext.getJSModule(JSTimers::class.java)).thenReturn(mJSTimersMock)
    doAnswer { invocation -> (invocation.arguments[0] as Runnable).run() }
      .`when`(reactContext)
      .runOnJSQueueThread(any(Runnable::class.java))
    timingModule.initialize()
  }

  private fun stepChoreographerFrame() {
    val callback = postFrameCallbackHandler.getAndResetFrameCallback()
    val idleCallback = idlePostFrameCallbackHandler.getAndResetFrameCallback()
    mCurrentTimeNs += FRAME_TIME_NS
    whenever(SystemClock.uptimeMillis()).thenAnswer {
      return@thenAnswer mCurrentTimeNs / 1000000
    }
    callback?.doFrame(mCurrentTimeNs)
    idleCallback?.doFrame(mCurrentTimeNs)
  }

  @Test
  fun testSimpleTimer() {
    timingModule.onHostResume()
    timingModule.createTimer(1.0, 1.0, 0.0, false)
    stepChoreographerFrame()
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(1.0))
    reset(mJSTimersMock)
    stepChoreographerFrame()
    verifyNoMoreInteractions(mJSTimersMock)
  }

  @Test
  fun testSimpleRecurringTimer() {
    timingModule.createTimer(100.0, 1.0, 0.0, true)
    timingModule.onHostResume()
    stepChoreographerFrame()
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(100.0))
    reset(mJSTimersMock)
    stepChoreographerFrame()
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(100.0))
  }

  @Test
  fun testCancelRecurringTimer() {
    timingModule.onHostResume()
    timingModule.createTimer(105.0, 1.0, 0.0, true)
    stepChoreographerFrame()
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(105.0))
    reset(mJSTimersMock)
    timingModule.deleteTimer(105.0)
    stepChoreographerFrame()
    verifyNoMoreInteractions(mJSTimersMock)
  }

  @Test
  fun testPausingAndResuming() {
    timingModule.onHostResume()
    timingModule.createTimer(41.0, 1.0, 0.0, true)
    stepChoreographerFrame()
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(41.0))
    reset(mJSTimersMock)
    timingModule.onHostPause()
    stepChoreographerFrame()
    verifyNoMoreInteractions(mJSTimersMock)
    reset(mJSTimersMock)
    timingModule.onHostResume()
    stepChoreographerFrame()
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(41.0))
  }

  @Test
  fun testHeadlessJsTaskInBackground() {
    timingModule.onHostPause()
    timingModule.onHeadlessJsTaskStart(42)
    timingModule.createTimer(41.0, 1.0, 0.0, true)
    stepChoreographerFrame()
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(41.0))
    reset(mJSTimersMock)
    timingModule.onHeadlessJsTaskFinish(42)
    stepChoreographerFrame()
    verifyNoMoreInteractions(mJSTimersMock)
  }

  @Test
  fun testHeadlessJsTaskInForeground() {
    timingModule.onHostResume()
    timingModule.onHeadlessJsTaskStart(42)
    timingModule.createTimer(41.0, 1.0, 0.0, true)
    stepChoreographerFrame()
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(41.0))
    reset(mJSTimersMock)
    timingModule.onHeadlessJsTaskFinish(42)
    stepChoreographerFrame()
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(41.0))
    reset(mJSTimersMock)
    timingModule.onHostPause()
    verifyNoMoreInteractions(mJSTimersMock)
  }

  @Test
  fun testHeadlessJsTaskIntertwine() {
    timingModule.onHostResume()
    timingModule.onHeadlessJsTaskStart(42)
    timingModule.createTimer(41.0, 1.0, 0.0, true)
    timingModule.onHostPause()
    stepChoreographerFrame()
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(41.0))
    reset(mJSTimersMock)
    timingModule.onHostResume()
    timingModule.onHeadlessJsTaskFinish(42)
    stepChoreographerFrame()
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(41.0))
    reset(mJSTimersMock)
    timingModule.onHostPause()
    stepChoreographerFrame()
    verifyNoMoreInteractions(mJSTimersMock)
  }

  @Test
  fun testSetTimeoutZero() {
    timingModule.createTimer(100.0, 0.0, 0.0, false)
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(100.0))
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
  @Ignore("Failing due to failed invocation verification") // TODO T13905097
  fun testIdleCallback() {
    timingModule.onHostResume()
    timingModule.setSendIdleEvents(true)
    stepChoreographerFrame()
    verify(mJSTimersMock).callIdleCallbacks(SystemClock.currentTimeMillis().toDouble())
  }

  private class PostFrameCallbackHandler : Answer<Unit> {

    private var mFrameCallback: FrameCallback? = null

    override fun answer(invocation: InvocationOnMock) {
      invocation.arguments[1]?.let { mFrameCallback = it as FrameCallback }
    }

    fun getAndResetFrameCallback(): FrameCallback? {
      val callback = mFrameCallback
      mFrameCallback = null
      return callback
    }
  }
}
