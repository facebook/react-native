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
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.SimpleArray;
import com.facebook.react.uimanager.ReactChoreographer;
import com.facebook.react.common.SystemClock;
import com.facebook.react.modules.core.JSTimersExecution;
import com.facebook.react.modules.core.Timing;

import org.junit.After;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.annotation.Config;

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
  private ReactChoreographer mChoreographerMock;
  private PostFrameCallbackHandler mPostFrameCallbackHandler;
  private long mCurrentTimeNs;
  private JSTimersExecution mJSTimersMock;

  @Rule
  public PowerMockRule rule = new PowerMockRule();

  @Before
  public void prepareModules() {
    PowerMockito.mockStatic(Arguments.class);
    when(Arguments.createArray()).thenAnswer(
        new Answer<Object>() {
          @Override
          public Object answer(InvocationOnMock invocation) throws Throwable {
            return new SimpleArray();
          }
        });

    PowerMockito.mockStatic(SystemClock.class);
    when(SystemClock.currentTimeMillis()).thenReturn(mCurrentTimeNs / 1000000);
    when(SystemClock.nanoTime()).thenReturn(mCurrentTimeNs);

    mChoreographerMock = mock(ReactChoreographer.class);
    PowerMockito.mockStatic(ReactChoreographer.class);
    when(ReactChoreographer.getInstance()).thenReturn(mChoreographerMock);

    CatalystInstance reactInstance = mock(CatalystInstance.class);
    ReactApplicationContext reactContext = mock(ReactApplicationContext.class);
    when(reactContext.getCatalystInstance()).thenReturn(reactInstance);

    mCurrentTimeNs = 0;
    mPostFrameCallbackHandler = new PostFrameCallbackHandler();

    doAnswer(mPostFrameCallbackHandler)
        .when(mChoreographerMock)
        .postFrameCallback(
            eq(ReactChoreographer.CallbackType.TIMERS_EVENTS),
            any(Choreographer.FrameCallback.class));

    mTiming = new Timing(reactContext);
    mJSTimersMock = mock(JSTimersExecution.class);
    when(reactInstance.getJSModule(JSTimersExecution.class)).thenReturn(mJSTimersMock);
    mTiming.initialize();
  }

  private void stepChoreographerFrame() {
    Choreographer.FrameCallback callback = mPostFrameCallbackHandler.getAndResetFrameCallback();
    mCurrentTimeNs += FRAME_TIME_NS;
    if (callback != null) {
      callback.doFrame(mCurrentTimeNs);
    }
  }

  @Test
  public void testSimpleTimer() {
    mTiming.onHostResume();
    mTiming.createTimer(1, 0, 0, false);
    stepChoreographerFrame();
    verify(mJSTimersMock).callTimers(SimpleArray.of(1));
    reset(mJSTimersMock);
    stepChoreographerFrame();
    verifyNoMoreInteractions(mJSTimersMock);
  }

  @Test
  public void testSimpleRecurringTimer() {
    mTiming.createTimer(100, 0, 0, true);
    mTiming.onHostResume();
    stepChoreographerFrame();
    verify(mJSTimersMock).callTimers(SimpleArray.of(100));

    reset(mJSTimersMock);
    stepChoreographerFrame();
    verify(mJSTimersMock).callTimers(SimpleArray.of(100));
  }

  @Test
  public void testCancelRecurringTimer() {
    mTiming.onHostResume();
    mTiming.createTimer(105, 0, 0, true);

    stepChoreographerFrame();
    verify(mJSTimersMock).callTimers(SimpleArray.of(105));

    reset(mJSTimersMock);
    mTiming.deleteTimer(105);
    stepChoreographerFrame();
    verifyNoMoreInteractions(mJSTimersMock);
  }

  @Test
  public void testPausingAndResuming() {
    mTiming.onHostResume();
    mTiming.createTimer(41, 0, 0, true);

    stepChoreographerFrame();
    verify(mJSTimersMock).callTimers(SimpleArray.of(41));

    reset(mJSTimersMock);
    mTiming.onHostPause();
    stepChoreographerFrame();
    verifyNoMoreInteractions(mJSTimersMock);

    reset(mJSTimersMock);
    mTiming.onHostResume();
    stepChoreographerFrame();
    verify(mJSTimersMock).callTimers(SimpleArray.of(41));
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
