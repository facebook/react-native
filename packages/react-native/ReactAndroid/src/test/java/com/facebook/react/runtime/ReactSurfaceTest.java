/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.robolectric.shadows.ShadowInstrumentation.getInstrumentation;

import android.app.Activity;
import android.content.Context;
import android.view.View;
import com.facebook.react.bridge.NativeMap;
import com.facebook.react.interfaces.fabric.SurfaceHandler;
import com.facebook.react.runtime.internal.bolts.Task;
import com.facebook.react.uimanager.events.EventDispatcher;
import java.util.concurrent.Callable;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;
import org.robolectric.Robolectric;
import org.robolectric.RobolectricTestRunner;

@RunWith(RobolectricTestRunner.class)
public class ReactSurfaceTest {
  @Mock ReactHostDelegate mReactHostDelegate;
  @Mock EventDispatcher mEventDispatcher;

  private ReactHostImpl mReactHost;
  private Context mContext;
  private ReactSurfaceImpl mReactSurface;
  private TestSurfaceHandler mSurfaceHandler;

  @Before
  public void setUp() {
    MockitoAnnotations.initMocks(this);

    mContext = Robolectric.buildActivity(Activity.class).create().get();

    mReactHost = spy(new ReactHostImpl(mContext, mReactHostDelegate, null, false, null, false));
    doAnswer(mockedStartSurface()).when(mReactHost).startSurface(any(ReactSurfaceImpl.class));
    doAnswer(mockedStartSurface()).when(mReactHost).prerenderSurface(any(ReactSurfaceImpl.class));
    doAnswer(mockedStopSurface()).when(mReactHost).stopSurface(any(ReactSurfaceImpl.class));
    doReturn(mEventDispatcher).when(mReactHost).getEventDispatcher();

    mSurfaceHandler = new TestSurfaceHandler();
    mReactSurface = new ReactSurfaceImpl(mSurfaceHandler, mContext);
    mReactSurface.attachView(new ReactSurfaceView(mContext, mReactSurface));
  }

  @Test
  public void testAttach() {
    assertThat(mReactSurface.getReactHost()).isNull();
    mReactSurface.attach(mReactHost);
    assertThat(mReactSurface.getReactHost()).isEqualTo(mReactHost);
    assertThat(mReactSurface.isAttached()).isTrue();
  }

  @Test(expected = IllegalStateException.class)
  public void testAttachThrowExeption() {
    mReactSurface.attach(mReactHost);
    mReactSurface.attach(mReactHost);
  }

  @Test
  public void testPrerender() throws InterruptedException {
    mReactSurface.attach(mReactHost);
    Task<Void> task = (Task<Void>) mReactSurface.prerender();
    task.waitForCompletion();

    verify(mReactHost).prerenderSurface(mReactSurface);
    assertThat(mSurfaceHandler.isRunning).isTrue();
  }

  @Test
  public void testStart() throws InterruptedException {
    mReactSurface.attach(mReactHost);
    assertThat(mReactHost.isSurfaceAttached(mReactSurface)).isFalse();
    Task<Void> task = (Task<Void>) mReactSurface.start();
    task.waitForCompletion();

    verify(mReactHost).startSurface(mReactSurface);
    assertThat(mSurfaceHandler.isRunning).isTrue();
  }

  @Test
  public void testStop() throws InterruptedException {
    mReactSurface.attach(mReactHost);

    Task<Void> task = (Task<Void>) mReactSurface.start();
    task.waitForCompletion();

    task = (Task<Void>) mReactSurface.stop();
    task.waitForCompletion();

    verify(mReactHost).stopSurface(mReactSurface);
  }

  @Test
  public void testClear() {
    mReactSurface.getView().addView(new View(mContext));

    mReactSurface.clear();

    getInstrumentation().waitForIdleSync();

    assertThat(mReactSurface.getView().getId()).isEqualTo(View.NO_ID);
    assertThat(mReactSurface.getView().getChildCount()).isEqualTo(0);
  }

  @Test
  public void testGetLayoutSpecs() {
    int measureSpecWidth = Integer.MAX_VALUE;
    int measureSpecHeight = Integer.MIN_VALUE;

    assertThat(mSurfaceHandler.mWidthMeasureSpec).isNotEqualTo(measureSpecWidth);
    assertThat(mSurfaceHandler.mHeightMeasureSpec).isNotEqualTo(measureSpecHeight);

    mReactSurface.attach(mReactHost);
    mReactSurface.updateLayoutSpecs(measureSpecWidth, measureSpecHeight, 2, 3);

    assertThat(mSurfaceHandler.mWidthMeasureSpec).isEqualTo(measureSpecWidth);
    assertThat(mSurfaceHandler.mHeightMeasureSpec).isEqualTo(measureSpecHeight);
  }

  @Test
  public void testGetEventDispatcher() {
    mReactSurface.attach(mReactHost);
    assertThat(mReactSurface.getEventDispatcher()).isEqualTo(mEventDispatcher);
  }

  @Test
  public void testStartStopHandlerCalls() throws InterruptedException {
    mReactSurface.attach(mReactHost);

    assertThat(mReactSurface.isRunning()).isFalse();

    Task<Void> task = (Task<Void>) mReactSurface.start();
    task.waitForCompletion();

    assertThat(mReactSurface.isRunning()).isTrue();

    task = (Task<Void>) mReactSurface.stop();
    task.waitForCompletion();

    assertThat(mReactSurface.isRunning()).isFalse();
  }

  private Answer<Task<Void>> mockedStartSurface() {
    return new Answer<Task<Void>>() {
      @Override
      public Task<Void> answer(InvocationOnMock invocation) {
        return Task.call(
            new Callable<Void>() {
              @Override
              public Void call() {
                mSurfaceHandler.start();
                return null;
              }
            });
      }
    };
  }

  private Answer<Task<Boolean>> mockedStopSurface() {
    return new Answer<Task<Boolean>>() {
      @Override
      public Task<Boolean> answer(InvocationOnMock invocation) {
        return Task.call(
            new Callable<Boolean>() {
              @Override
              public Boolean call() {
                mSurfaceHandler.stop();
                return true;
              }
            });
      }
    };
  }

  static class TestSurfaceHandler implements SurfaceHandler {
    private boolean isRunning = false;
    private int mSurfaceId = 0;

    private int mHeightMeasureSpec = 0;
    private int mWidthMeasureSpec = 0;

    @Override
    public void start() {
      isRunning = true;
    }

    @Override
    public void stop() {
      isRunning = false;
    }

    @Override
    public int getSurfaceId() {
      return mSurfaceId;
    }

    @Override
    public void setSurfaceId(int surfaceId) {
      mSurfaceId = surfaceId;
    }

    @Override
    public boolean isRunning() {
      return isRunning;
    }

    @Override
    public String getModuleName() {
      return null;
    }

    @Override
    public void setMountable(boolean mountable) {
      // no-op
    }

    @Override
    public void setLayoutConstraints(
        int widthMeasureSpec,
        int heightMeasureSpec,
        int offsetX,
        int offsetY,
        boolean doLeftAndRightSwapInRTL,
        boolean isRTL,
        float pixelDensity) {
      mWidthMeasureSpec = widthMeasureSpec;
      mHeightMeasureSpec = heightMeasureSpec;
    }

    @Override
    public void setProps(NativeMap props) {
      // no-op
    }
  }
}
