/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tests;

import android.view.View;
import com.facebook.react.bridge.BaseJavaModule;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.testing.ReactAppInstrumentationTestCase;
import com.facebook.react.testing.ReactInstanceSpecForTest;
import com.facebook.react.views.swiperefresh.ReactSwipeRefreshLayout;

/** Test case for {@link ReactSwipeRefreshLayout}. */
public class ReactSwipeRefreshLayoutTestCase extends ReactAppInstrumentationTestCase {

  private class SwipeRefreshLayoutRecordingModule extends BaseJavaModule {
    private int mCount = 0;

    @Override
    public String getName() {
      return "SwipeRefreshLayoutRecordingModule";
    }

    @ReactMethod
    public void onRefresh() {
      mCount++;
    }

    public int getCount() {
      return mCount;
    }
  }

  private interface SwipeRefreshLayoutTestModule extends JavaScriptModule {
    void setRows(int rows);
  }

  private final SwipeRefreshLayoutRecordingModule mRecordingModule =
      new SwipeRefreshLayoutRecordingModule();

  @Override
  protected String getReactApplicationKeyUnderTest() {
    return "SwipeRefreshLayoutTestApp";
  }

  @Override
  protected ReactInstanceSpecForTest createReactInstanceSpecForTest() {
    return super.createReactInstanceSpecForTest().addNativeModule(mRecordingModule);
  }

  public void testRefreshNoScroll() {
    View refreshLayout = getViewAtPath(0);

    createGestureGenerator()
        .startGesture(refreshLayout.getWidth() / 2, 10)
        .dragTo(refreshLayout.getWidth() / 2, refreshLayout.getHeight() / 2, 100, 1000)
        .endGesture();
    waitForBridgeAndUIIdle();
    assertEquals(1, mRecordingModule.getCount());
  }

  public void testRefreshScroll() {
    View refreshLayout = getViewAtPath(0);

    getReactContext().getJSModule(SwipeRefreshLayoutTestModule.class).setRows(100);

    createGestureGenerator()
        .startGesture(refreshLayout.getWidth() / 2, 10)
        .dragTo(refreshLayout.getWidth() / 2, refreshLayout.getHeight() / 2, 100, 1000)
        .endGesture();
    waitForBridgeAndUIIdle();
    assertEquals(1, mRecordingModule.getCount());
  }

  public void testNoRefreshAfterScroll() {
    View refreshLayout = getViewAtPath(0);

    getReactContext().getJSModule(SwipeRefreshLayoutTestModule.class).setRows(100);

    createGestureGenerator()
        .startGesture(refreshLayout.getWidth() / 2, refreshLayout.getHeight() / 2)
        .dragTo(refreshLayout.getWidth() / 2, 10, 100, 1000)
        .endGesture();
    waitForBridgeAndUIIdle();
    createGestureGenerator()
        .startGesture(refreshLayout.getWidth() / 2, 10)
        .dragTo(refreshLayout.getWidth() / 2, refreshLayout.getHeight() / 2, 100, 1000)
        .endGesture();
    waitForBridgeAndUIIdle();
    assertEquals(0, mRecordingModule.getCount());
  }
}
