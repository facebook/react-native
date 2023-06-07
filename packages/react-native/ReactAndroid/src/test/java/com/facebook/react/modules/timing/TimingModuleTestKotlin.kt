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
import org.mockito.invocation.InvocationOnMock
import org.mockito.stubbing.Answer
import org.powermock.api.mockito.PowerMockito
import org.powermock.core.classloader.annotations.PowerMockIgnore
import org.powermock.core.classloader.annotations.PrepareForTest
import org.powermock.modules.junit4.rule.PowerMockRule
import org.robolectric.RobolectricTestRunner
import org.mockito.Mockito.`when` as mockWhen

@[
PrepareForTest(Arguments::class, SystemClock::class, ReactChoreographer::class)
PowerMockIgnore("org.mockito.*", "org.robolectric.*", "androidx.*", "android.*")
RunWith(RobolectricTestRunner::class)
]
class TimingModuleTestKotlin {
  companion object {
    const val FRAME_TIME_NS = 17 * 1000 * 1000
  }

  private lateinit var mTimingModule: TimingModule
  private lateinit var mReactChoreographerMock: ReactChoreographer
  private lateinit var mPostFrameCallbackHandler: PostFrameCallbackHandler
  private lateinit var mIdlePostFrameCallbackHandler: PostFrameIdleCallbackHandler
  private var mCurrentTimeNs = 0L
  private lateinit var mJSTimersMock: JSTimers

  @get:Rule
  val powerMockRule = PowerMockRule()

  @Before
  fun prepareModules() {
    PowerMockito.mockStatic(Arguments::class.java)
    mockWhen(Arguments.createArray()).thenAnswer {
        return@thenAnswer JavaOnlyArray()
      }

    PowerMockito.mockStatic(SystemClock::class.java)
    mockWhen(SystemClock.uptimeMillis()).thenAnswer { return@thenAnswer mCurrentTimeNs / 1000000 }
    mockWhen(SystemClock.currentTimeMillis()).thenAnswer { return@thenAnswer mCurrentTimeNs / 1000000 }
    mockWhen(SystemClock.nanoTime()).thenAnswer { return@thenAnswer mCurrentTimeNs }

    mReactChoreographerMock = mock(ReactChoreographer::class.java)
    PowerMockito.mockStatic(ReactChoreographer::class.java)
    mockWhen(ReactChoreographer.getInstance()).thenAnswer { mReactChoreographerMock }

    val reactInstance = mock(CatalystInstance::class.java)
    val reactContext = mock(ReactApplicationContext::class.java)
    mockWhen(reactContext.catalystInstance).thenReturn(reactInstance)
    mockWhen(reactContext.hasActiveReactInstance()).thenReturn(true)

    mPostFrameCallbackHandler = PostFrameCallbackHandler()
    mIdlePostFrameCallbackHandler = PostFrameIdleCallbackHandler()

    doAnswer(mPostFrameCallbackHandler)
      .`when`(mReactChoreographerMock)
      .postFrameCallback(
        eq(CallbackType.TIMERS_EVENTS),
        any(FrameCallback::class.java)
      )

    doAnswer(mIdlePostFrameCallbackHandler)
      .`when`(mReactChoreographerMock)
      .postFrameCallback(
        eq(CallbackType.IDLE_EVENT),
        any(FrameCallback::class.java)
      )

    mTimingModule = TimingModule(
      reactContext, mock(
        DevSupportManager::class.java
      )
    )
    mJSTimersMock = mock(JSTimers::class.java)
    mockWhen(reactContext.getJSModule(JSTimers::class.java)).thenReturn(mJSTimersMock)
    doAnswer {  invocation ->
      (invocation.arguments[0] as Runnable).run()
    }.`when`(reactContext).runOnJSQueueThread(any(Runnable::class.java))
    mTimingModule.initialize()
  }

  private fun stepChoreographerFrame() {
    val callback = mPostFrameCallbackHandler.getAndResetFrameCallback()
    val idleCallback = mIdlePostFrameCallbackHandler.getAndResetFrameCallback()
    mCurrentTimeNs += FRAME_TIME_NS
    mockWhen(SystemClock.uptimeMillis()).thenAnswer { return@thenAnswer mCurrentTimeNs / 1000000 }
    callback?.doFrame(mCurrentTimeNs)
    idleCallback?.doFrame(mCurrentTimeNs)
  }

  @Test
  fun testSimpleTimer() {
    mTimingModule.onHostResume()
    mTimingModule.createTimer(1.0, 1.0, 0.0, false)
    stepChoreographerFrame()
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(1.0))
    reset(mJSTimersMock)
    stepChoreographerFrame()
    verifyNoMoreInteractions(mJSTimersMock)
  }

  @Test
  fun testSimpleRecurringTimer() {
    mTimingModule.createTimer(100.0, 1.0, 0.0, true)
    mTimingModule.onHostResume()
    stepChoreographerFrame()
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(100.0))
    reset(mJSTimersMock)
    stepChoreographerFrame()
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(100.0))
  }

  @Test
  fun testCancelRecurringTimer() {
    mTimingModule.onHostResume()
    mTimingModule.createTimer(105.0, 1.0, 0.0, true)
    stepChoreographerFrame()
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(105.0))
    reset(mJSTimersMock)
    mTimingModule.deleteTimer(105.0)
    stepChoreographerFrame()
    verifyNoMoreInteractions(mJSTimersMock)
  }

  @Test
  fun testPausingAndResuming() {
    mTimingModule.onHostResume()
    mTimingModule.createTimer(41.0, 1.0, 0.0, true)
    stepChoreographerFrame()
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(41.0))
    reset(mJSTimersMock)
    mTimingModule.onHostPause()
    stepChoreographerFrame()
    verifyNoMoreInteractions(mJSTimersMock)
    reset(mJSTimersMock)
    mTimingModule.onHostResume()
    stepChoreographerFrame()
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(41.0))
  }

  @Test
  fun testHeadlessJsTaskInBackground() {
    mTimingModule.onHostPause()
    mTimingModule.onHeadlessJsTaskStart(42)
    mTimingModule.createTimer(41.0, 1.0, 0.0, true)
    stepChoreographerFrame()
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(41.0))
    reset(mJSTimersMock)
    mTimingModule.onHeadlessJsTaskFinish(42)
    stepChoreographerFrame()
    verifyNoMoreInteractions(mJSTimersMock)
  }

  @Test
  fun testHeadlessJsTaskInForeground() {
    mTimingModule.onHostResume()
    mTimingModule.onHeadlessJsTaskStart(42)
    mTimingModule.createTimer(41.0, 1.0, 0.0, true)
    stepChoreographerFrame()
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(41.0))
    reset(mJSTimersMock)
    mTimingModule.onHeadlessJsTaskFinish(42)
    stepChoreographerFrame()
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(41.0))
    reset(mJSTimersMock)
    mTimingModule.onHostPause()
    verifyNoMoreInteractions(mJSTimersMock)
  }

  @Test
  fun testHeadlessJsTaskIntertwine() {
    mTimingModule.onHostResume()
    mTimingModule.onHeadlessJsTaskStart(42)
    mTimingModule.createTimer(41.0, 1.0, 0.0, true)
    mTimingModule.onHostPause()
    stepChoreographerFrame()
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(41.0))
    reset(mJSTimersMock)
    mTimingModule.onHostResume()
    mTimingModule.onHeadlessJsTaskFinish(42)
    stepChoreographerFrame()
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(41.0))
    reset(mJSTimersMock)
    mTimingModule.onHostPause()
    stepChoreographerFrame()
    verifyNoMoreInteractions(mJSTimersMock)
  }

  @Test
  fun testSetTimeoutZero() {
    mTimingModule.createTimer(100.0, 0.0, 0.0, false)
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(100.0))
  }

  @Test
  fun testActiveTimersInRange() {
    mTimingModule.onHostResume()
    assertThat(mTimingModule.hasActiveTimersInRange(100)).isFalse
    mTimingModule.createTimer(41.0, 1.0, 0.0, true)
    assertThat(mTimingModule.hasActiveTimersInRange(100)).isFalse // Repeating
    mTimingModule.createTimer(42.0, 150.0, 0.0, false)
    assertThat(mTimingModule.hasActiveTimersInRange(100)).isFalse // Out of range
    assertThat(mTimingModule.hasActiveTimersInRange(200)).isTrue // In range
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

  private class PostFrameIdleCallbackHandler : Answer<Unit> {
    private var mFrameCallback: FrameCallback? = null

    @Throws(Throwable::class)
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
