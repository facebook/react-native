/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.timing;

import android.view.Choreographer;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ExecutorToken;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.JavaOnlyArray;
import com.facebook.react.devsupport.DevSupportManager;
import com.facebook.react.uimanager.ReactChoreographer;
import com.facebook.react.common.SystemClock;
import com.facebook.react.modules.core.JSTimersExecution;
import com.facebook.react.modules.core.Timing;

import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.robolectric.RobolectricTestRunner;

import static org.mockito.Mockito.*;

/**
 * Tests for {@link Timing}.
 */
@PrepareForTest({Arguments.class, SystemClock.class, ReactChoreographer.class})
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "android.*"})
@RunWith(RobolectricTestRunner.class)
public class TimingModuleTest {

  private static final long FRAME_TIME_NS = 17 * 1000 * 1000; // 17 ms

  private Timing mTiming;
  private ReactChoreographer mReactChoreographerMock;
  private PostFrameCallbackHandler mPostFrameCallbackHandler;
  private PostFrameIdleCallbackHandler mIdlePostFrameCallbackHandler;
  private long mCurrentTimeNs;
  private JSTimersExecution mJSTimersMock;
  private ExecutorToken mExecutorTokenMock;

  @Rule
  public PowerMockRule rule = new PowerMockRule();

  @Before
  public void prepareModules() {
    PowerMockito.mockStatic(Arguments.class);
    when(Arguments.createArray()).thenAnswer(
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

    mCurrentTimeNs = 0;
    mPostFrameCallbackHandler = new PostFrameCallbackHandler();
    mIdlePostFrameCallbackHandler = new PostFrameIdleCallbackHandler();

    doAnswer(mPostFrameCallbackHandler)
        .when(mReactChoreographerMock)
        .postFrameCallback(
            eq(ReactChoreographer.CallbackType.TIMERS_EVENTS),
            any(Choreographer.FrameCallback.class));

    doAnswer(mIdlePostFrameCallbackHandler)
        .when(mReactChoreographerMock)
        .postFrameCallback(
            eq(ReactChoreographer.CallbackType.IDLE_EVENT),
            any(Choreographer.FrameCallback.class));

    mTiming = new Timing(reactContext, mock(DevSupportManager.class));
    mJSTimersMock = mock(JSTimersExecution.class);
    mExecutorTokenMock = mock(ExecutorToken.class);
    when(reactContext.getJSModule(mExecutorTokenMock, JSTimersExecution.class)).thenReturn(mJSTimersMock);

    doAnswer(new Answer() {
      @Override
      public Object answer(InvocationOnMock invocation) throws Throwable {
        ((Runnable)invocation.getArguments()[0]).run();
        return null;
      }
    }).when(reactContext).runOnJSQueueThread(any(Runnable.class));

    mTiming.initialize();
  }

  private void stepChoreographerFrame() {
    Choreographer.FrameCallback callback = mPostFrameCallbackHandler.getAndResetFrameCallback();
    Choreographer.FrameCallback idleCallback = mIdlePostFrameCallbackHandler.getAndResetFrameCallback();

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
    mTiming.onHostResume();
    mTiming.createTimer(mExecutorTokenMock, 1, 1, 0, false);
    stepChoreographerFrame();
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(1));
    reset(mJSTimersMock);
    stepChoreographerFrame();
    verifyNoMoreInteractions(mJSTimersMock);
  }

  @Test
  public void testSimpleRecurringTimer() {
    mTiming.createTimer(mExecutorTokenMock, 100, 1, 0, true);
    mTiming.onHostResume();
    stepChoreographerFrame();
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(100));

    reset(mJSTimersMock);
    stepChoreographerFrame();
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(100));
  }

  @Test
  public void testCancelRecurringTimer() {
    mTiming.onHostResume();
    mTiming.createTimer(mExecutorTokenMock, 105, 1, 0, true);

    stepChoreographerFrame();
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(105));

    reset(mJSTimersMock);
    mTiming.deleteTimer(mExecutorTokenMock, 105);
    stepChoreographerFrame();
    verifyNoMoreInteractions(mJSTimersMock);
  }

  @Test
  public void testPausingAndResuming() {
    mTiming.onHostResume();
    mTiming.createTimer(mExecutorTokenMock, 41, 1, 0, true);

    stepChoreographerFrame();
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(41));

    reset(mJSTimersMock);
    mTiming.onHostPause();
    stepChoreographerFrame();
    verifyNoMoreInteractions(mJSTimersMock);

    reset(mJSTimersMock);
    mTiming.onHostResume();
    stepChoreographerFrame();
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(41));
  }

  @Test
  public void testHeadlessJsTaskInBackground() {
    mTiming.onHostPause();
    mTiming.onHeadlessJsTaskStart(42);
    mTiming.createTimer(mExecutorTokenMock, 41, 1, 0, true);

    stepChoreographerFrame();
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(41));

    reset(mJSTimersMock);
    mTiming.onHeadlessJsTaskFinish(42);
    stepChoreographerFrame();
    verifyNoMoreInteractions(mJSTimersMock);
  }

  @Test
  public void testHeadlessJsTaskInForeground() {
    mTiming.onHostResume();
    mTiming.onHeadlessJsTaskStart(42);
    mTiming.createTimer(mExecutorTokenMock, 41, 1, 0, true);

    stepChoreographerFrame();
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(41));

    reset(mJSTimersMock);
    mTiming.onHeadlessJsTaskFinish(42);
    stepChoreographerFrame();
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(41));

    reset(mJSTimersMock);
    mTiming.onHostPause();
    verifyNoMoreInteractions(mJSTimersMock);
  }

  @Test
  public void testHeadlessJsTaskIntertwine() {
    mTiming.onHostResume();
    mTiming.onHeadlessJsTaskStart(42);
    mTiming.createTimer(mExecutorTokenMock, 41, 1, 0, true);
    mTiming.onHostPause();

    stepChoreographerFrame();
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(41));

    reset(mJSTimersMock);
    mTiming.onHostResume();
    mTiming.onHeadlessJsTaskFinish(42);
    stepChoreographerFrame();
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(41));

    reset(mJSTimersMock);
    mTiming.onHostPause();
    stepChoreographerFrame();
    verifyNoMoreInteractions(mJSTimersMock);
  }

  @Test
  public void testSetTimeoutZero() {
    mTiming.createTimer(mExecutorTokenMock, 100, 0, 0, false);
    verify(mJSTimersMock).callTimers(JavaOnlyArray.of(100));
  }

  @Test
  public void testIdleCallback() {
    mTiming.onHostResume();
    mTiming.setSendIdleEvents(mExecutorTokenMock, true);

    stepChoreographerFrame();
    verify(mJSTimersMock).callIdleCallbacks(SystemClock.currentTimeMillis());
  }

  private static class PostFrameIdleCallbackHandler implements Answer<Void> {

    private Choreographer.FrameCallback mFrameCallback;

    @Override
    public Void answer(InvocationOnMock invocation) throws Throwable {
      Object[] args = invocation.getArguments();
      mFrameCallback = (Choreographer.FrameCallback) args[1];
      return null;
    }

    public Choreographer.FrameCallback getAndResetFrameCallback() {
      Choreographer.FrameCallback callback = mFrameCallback;
      mFrameCallback = null;
      return callback;
    }
  }

  private static class PostFrameCallbackHandler implements Answer<Void> {

    private Choreographer.FrameCallback mFrameCallback;

    @Override
    public Void answer(InvocationOnMock invocation) throws Throwable {
      Object[] args = invocation.getArguments();
      mFrameCallback = (Choreographer.FrameCallback) args[1];
      return null;
    }

    public Choreographer.FrameCallback getAndResetFrameCallback() {
      Choreographer.FrameCallback callback = mFrameCallback;
      mFrameCallback = null;
      return callback;
    }
  }
}
