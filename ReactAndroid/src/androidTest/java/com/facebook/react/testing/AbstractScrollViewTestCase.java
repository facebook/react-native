/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.testing;

import java.util.ArrayList;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

import com.facebook.react.bridge.BaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.testing.ReactInstanceSpecForTest;
import com.facebook.react.testing.ReactAppInstrumentationTestCase;

/**
 * Shared by {@link ReactScrollViewTestCase} and {@link ReactHorizontalScrollViewTestCase}.
 * See also ScrollViewTestModule.js
 */
public abstract class AbstractScrollViewTestCase extends ReactAppInstrumentationTestCase {

  protected ScrollListenerModule mScrollListenerModule;

  protected static interface ScrollViewTestModule extends JavaScriptModule {
    public void scrollTo(float destX, float destY);
  }

  @Override
  protected void tearDown() throws Exception {
    waitForBridgeAndUIIdle(60000);
    super.tearDown();
  }

  @Override
  protected ReactInstanceSpecForTest createReactInstanceSpecForTest() {
    mScrollListenerModule = new ScrollListenerModule();
    return super.createReactInstanceSpecForTest()
        .addNativeModule(mScrollListenerModule);
  }

  // See ScrollViewListenerModule.js
  protected static class ScrollListenerModule extends BaseJavaModule {

    private final ArrayList<Double> mXOffsets = new ArrayList<Double>();
    private final ArrayList<Double> mYOffsets = new ArrayList<Double>();
    private final ArrayList<Integer> mItemsPressed = new ArrayList<Integer>();
    private final Semaphore mScrollSignaler = new Semaphore(0);
    private boolean mScrollBeginDragCalled;
    private boolean mScrollEndDragCalled;

    // Matches ScrollViewListenerModule.js
    @Override
    public String getName() {
      return "ScrollListener";
    }

    @ReactMethod
    public void onScroll(double x, double y) {
      mXOffsets.add(x);
      mYOffsets.add(y);
      mScrollSignaler.release();
    }

    @ReactMethod
    public void onItemPress(int itemNumber) {
      mItemsPressed.add(itemNumber);
    }

    @ReactMethod
    public void onScrollBeginDrag(double x, double y) {
      mScrollBeginDragCalled = true;
    }

    @ReactMethod
    public void onScrollEndDrag(double x, double y) {
      mScrollEndDragCalled = true;
    }

    public void waitForScrollIdle() {
      while (true) {
        try {
          boolean gotScrollSignal = mScrollSignaler.tryAcquire(1000, TimeUnit.MILLISECONDS);
          if (!gotScrollSignal) {
            return;
          }
        } catch (InterruptedException e) {
          throw new RuntimeException(e);
        }
      }
    }

    public ArrayList<Double> getXOffsets() {
      return mXOffsets;
    }

    public ArrayList<Double> getYOffsets() {
      return mYOffsets;
    }

    public ArrayList<Integer> getItemsPressed() {
      return mItemsPressed;
    }

    public boolean dragEventsMatch() {
      return mScrollBeginDragCalled && mScrollEndDragCalled;
    }
  }
}
