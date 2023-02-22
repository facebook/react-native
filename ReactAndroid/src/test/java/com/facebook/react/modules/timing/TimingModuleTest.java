/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.timing;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.JavaOnlyArray;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.common.SystemClock;
import com.facebook.react.devsupport.interfaces.DevSupportManager;
import com.facebook.react.modules.core.ChoreographerCompat;
import com.facebook.react.modules.core.JSTimers;
import com.facebook.react.modules.core.ReactChoreographer;
import com.facebook.react.modules.core.TimingModule;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.robolectric.RobolectricTestRunner;

/** Tests for {@link TimingModule}. */
// DISABLED, BROKEN https://circleci.com/gh/facebook/react-native/12068
// t=13905097
@PrepareForTest({Arguments.class, SystemClock.class, ReactChoreographer.class})
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "androidx.*", "android.*"})
@RunWith(RobolectricTestRunner.class)
public class TimingModuleTest {

  private static final long FRAME_TIME_NS = 17 * 1000 * 1000; // 17 ms

  private TimingModule mTimingModule;
  private ReactChoreographer mReactChoreographerMock;
  private PostFrameCallbackHandler mPostFrameCallbackHandler;
  private PostFrameIdleCallbackHandler mIdlePostFrameCallbackHandler;
  private long mCurrentTimeNs;
  private JSTimers mJSTimersMock;

  @Rule public PowerMockRule rule = new PowerMockRule();

  @Before
  public void prepareModules() {
    PowerMockito.mockStatic(Arguments.class);
    when(Arguments.createArray())
        .thenAnswer(
            new Answer<Object>() {
              @Override
              public Object answer(InvocationOnMock invocation) throws Throwable {
                return new JavaOnlyArray();
              }
            });

    PowerMockito.mockStatic(SystemClock.class);
    when(SystemClock.uptimeMillis()).thenReturn(mCurrentTimeNs / 1000000);
    when(SystemClock.currentTimeMillis()).thenReturn(mCurrentTimeNs / 1000000);
    when(SystemClock.nanoTime()).thenReturn(mCurrentTimeNs);

    mReactChoreographerMock = mock(ReactChoreographer.class);
    PowerMockito.mockStatic(ReactChoreographer.class);
    when(ReactChoreographer.getInstance()).thenReturn(mReactChoreographerMock);

    CatalystInstance reactInstance = mock(CatalystInstance.class);
    ReactApplicationContext reactContext = mock(ReactApplicationContext.class);
    when(reactContext.getCatalystInstance()).thenReturn(reactInstance);
    when(reactContext.hasActiveReactInstance()).thenReturn(true);

    mCurrentTimeNs = 0;
    mPostFrameCallbackHandler = new PostFrameCallbackHandler();
    mIdlePostFrameCallbackHandler = new PostFrameIdleCallbackHandler();

    doAnswer(mPostFrameCallbackHandler)
        .when(mReactChoreographerMock)
        .postFrameCallback(
            eq(ReactChoreographer.CallbackType.TIMERS_EVENTS),
            any(ChoreographerCompat.FrameCallback.class));

    doAnswer(mIdlePostFrameCallbackHandler)
        .when(mReactChoreographerMock)
        .postFrameCallback(
            eq(ReactChoreographer.CallbackType.IDLE_EVENT),
            any(ChoreographerCompat.FrameCallback.class));

    mTimingModule = new TimingModule(reactContext, mock(DevSupportManager.class));
    mJSTimersMock = mock(JSTimers.class);
    when(reactContext.getJSModule(JSTimers.class)).thenReturn(mJSTimersMock);

    doAnswer(
            new Answer() {
              @Override
              public Object answer(InvocationOnMock invocation) throws Throwable {
                ((Runnable) invocation.getArguments()[0]).run();
                return null;
              }
            })
        .when(reactContext)
        .runOnJSQueueThread(any(Runnable.class));

    mTimingModule.initialize();
  }

  private void stepChoreographerFrame() {
    ChoreographerCompat.FrameCallback callback =
        mPostFrameCallbackHandler.getAndResetFrameCallback();
    ChoreographerCompat.FrameCallback idleCallback =
        mIdlePostFrameCallbackHandler.getAndResetFrameCallback();

    mCurrentTimeNs += FRAME_TIME_NS;
    when(SystemClock.uptimeMillis()).thenReturn(mCurrentTimeNs / 1000000);
    if (callback != null) {
      callback.doFrame(mCurrentTimeNs);
    }

    if (idleCallback != null) {
      idleCallback.doFrame(mCurrentTimeNs);
    }
  }

  @Test
  public void testSimpleTimer() {
    mTimingModule.onHostResume();
    mTimingModule.createTimer(1, 1, 0, false);
    stepChoreographerFrame();
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(1.0));
    reset(mJSTimersMock);
    stepChoreographerFrame();
    verifyNoMoreInteractions(mJSTimersMock);
  }

  @Test
  public void testSimpleRecurringTimer() {
    mTimingModule.createTimer(100, 1, 0, true);
    mTimingModule.onHostResume();
    stepChoreographerFrame();
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(100.0));

    reset(mJSTimersMock);
    stepChoreographerFrame();
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(100.0));
  }

  @Test
  public void testCancelRecurringTimer() {
    mTimingModule.onHostResume();
    mTimingModule.createTimer(105, 1, 0, true);

    stepChoreographerFrame();
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(105.0));

    reset(mJSTimersMock);
    mTimingModule.deleteTimer(105);
    stepChoreographerFrame();
    verifyNoMoreInteractions(mJSTimersMock);
  }

  @Test
  public void testPausingAndResuming() {
    mTimingModule.onHostResume();
    mTimingModule.createTimer(41, 1, 0, true);

    stepChoreographerFrame();
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(41.0));

    reset(mJSTimersMock);
    mTimingModule.onHostPause();
    stepChoreographerFrame();
    verifyNoMoreInteractions(mJSTimersMock);

    reset(mJSTimersMock);
    mTimingModule.onHostResume();
    stepChoreographerFrame();
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(41.0));
  }

  @Test
  public void testHeadlessJsTaskInBackground() {
    mTimingModule.onHostPause();
    mTimingModule.onHeadlessJsTaskStart(42);
    mTimingModule.createTimer(41, 1, 0, true);

    stepChoreographerFrame();
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(41.0));

    reset(mJSTimersMock);
    mTimingModule.onHeadlessJsTaskFinish(42);
    stepChoreographerFrame();
    verifyNoMoreInteractions(mJSTimersMock);
  }

  @Test
  public void testHeadlessJsTaskInForeground() {
    mTimingModule.onHostResume();
    mTimingModule.onHeadlessJsTaskStart(42);
    mTimingModule.createTimer(41, 1, 0, true);

    stepChoreographerFrame();
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(41.0));

    reset(mJSTimersMock);
    mTimingModule.onHeadlessJsTaskFinish(42);
    stepChoreographerFrame();
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(41.0));

    reset(mJSTimersMock);
    mTimingModule.onHostPause();
    verifyNoMoreInteractions(mJSTimersMock);
  }

  @Test
  public void testHeadlessJsTaskIntertwine() {
    mTimingModule.onHostResume();
    mTimingModule.onHeadlessJsTaskStart(42);
    mTimingModule.createTimer(41, 1, 0, true);
    mTimingModule.onHostPause();

    stepChoreographerFrame();
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(41.0));

    reset(mJSTimersMock);
    mTimingModule.onHostResume();
    mTimingModule.onHeadlessJsTaskFinish(42);
    stepChoreographerFrame();
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(41.0));

    reset(mJSTimersMock);
    mTimingModule.onHostPause();
    stepChoreographerFrame();
    verifyNoMoreInteractions(mJSTimersMock);
  }

  @Test
  public void testSetTimeoutZero() {
    mTimingModule.createTimer(100, 0, 0, false);
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(100.0));
  }

  @Test
  public void testIdleCallback() {
    mTimingModule.onHostResume();
    mTimingModule.setSendIdleEvents(true);

    stepChoreographerFrame();
    verify(mJSTimersMock).callIdleCallbacks(SystemClock.currentTimeMillis());
  }

  @Test
  public void testActiveTimersInRange() {
    mTimingModule.onHostResume();
    assertThat(mTimingModule.hasActiveTimersInRange(100)).isFalse();

    mTimingModule.createTimer(41, 1, 0, true);
    assertThat(mTimingModule.hasActiveTimersInRange(100)).isFalse(); // Repeating

    mTimingModule.createTimer(42, 150, 0, false);
    assertThat(mTimingModule.hasActiveTimersInRange(100)).isFalse(); // Out of range
    assertThat(mTimingModule.hasActiveTimersInRange(200)).isTrue(); // In range
  }

  private static class PostFrameIdleCallbackHandler implements Answer<Void> {

    private ChoreographerCompat.FrameCallback mFrameCallback;

    @Override
    public Void answer(InvocationOnMock invocation) throws Throwable {
      Object[] args = invocation.getArguments();
      mFrameCallback = (ChoreographerCompat.FrameCallback) args[1];
      return null;
    }

    public ChoreographerCompat.FrameCallback getAndResetFrameCallback() {
      ChoreographerCompat.FrameCallback callback = mFrameCallback;
      mFrameCallback = null;
      return callback;
    }
  }

  private static class PostFrameCallbackHandler implements Answer<Void> {

    private ChoreographerCompat.FrameCallback mFrameCallback;

    @Override
    public Void answer(InvocationOnMock invocation) throws Throwable {
      Object[] args = invocation.getArguments();
      mFrameCallback = (ChoreographerCompat.FrameCallback) args[1];
      return null;
    }

    public ChoreographerCompat.FrameCallback getAndResetFrameCallback() {
      ChoreographerCompat.FrameCallback callback = mFrameCallback;
      mFrameCallback = null;
      return callback;
    }
  }
}
