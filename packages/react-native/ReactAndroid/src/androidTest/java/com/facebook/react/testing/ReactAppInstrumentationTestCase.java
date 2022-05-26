/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.testing;

import android.content.Intent;
import android.graphics.Bitmap;
import android.test.ActivityInstrumentationTestCase2;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Assertions;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.testing.idledetection.IdleWaiter;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

/** Base class for instrumentation tests that runs React based react application in UI mode */
public abstract class ReactAppInstrumentationTestCase
    extends ActivityInstrumentationTestCase2<ReactAppTestActivity> implements IdleWaiter {

  public ReactAppInstrumentationTestCase() {
    super(ReactAppTestActivity.class);
  }

  @Override
  protected void setUp() throws Exception {
    super.setUp();

    Intent intent = new Intent();
    intent.putExtra(ReactAppTestActivity.EXTRA_IS_FABRIC_TEST, isFabricTest());
    setActivityIntent(intent);
    final ReactAppTestActivity activity = getActivity();
    activity.loadApp(
        getReactApplicationKeyUnderTest(), createReactInstanceSpecForTest(), getEnableDevSupport());
    waitForBridgeAndUIIdle(5000);
  }

  @Override
  protected void tearDown() throws Exception {
    ReactAppTestActivity activity = getActivity();
    super.tearDown();
    activity.waitForDestroy(5000);
  }

  public ViewGroup getRootView() {
    return (ViewGroup) getActivity().getRootView();
  }

  /**
   * This method isn't safe since it doesn't factor in layout-only view removal. Use {@link
   * #getViewByTestId(String)} instead.
   */
  @Deprecated
  public <T extends View> T getViewAtPath(int... path) {
    return ReactTestHelper.getViewAtPath((ViewGroup) getRootView().getParent(), path);
  }

  public <T extends View> T getViewByTestId(String testID) {
    return (T)
        ReactTestHelper.getViewWithReactTestId((ViewGroup) getRootView().getParent(), testID);
  }

  public SingleTouchGestureGenerator createGestureGenerator() {
    return new SingleTouchGestureGenerator(getRootView(), this);
  }

  public void waitForBridgeAndUIIdle() {
    getActivity().waitForBridgeAndUIIdle();
  }

  public void waitForBridgeAndUIIdle(long timeoutMs) {
    getActivity().waitForBridgeAndUIIdle(timeoutMs);
  }

  protected Bitmap getScreenshot() {
    // Wait for the UI to settle. If the UI is doing animations, this may be unsafe!
    getInstrumentation().waitForIdleSync();

    final CountDownLatch latch = new CountDownLatch(1);
    final BitmapHolder bitmapHolder = new BitmapHolder();
    final Runnable getScreenshotRunnable =
        new Runnable() {

          private static final int MAX_TRIES = 1000;
          // This is the constant used in the support library for APIs that don't have Choreographer
          private static final int FRAME_DELAY_MS = 10;

          private int mNumRuns = 0;

          @Override
          public void run() {
            mNumRuns++;
            ReactAppTestActivity activity = getActivity();
            if (!activity.isScreenshotReady()) {
              if (mNumRuns > MAX_TRIES) {
                throw new RuntimeException(
                    "Waited " + MAX_TRIES + " frames to get screenshot but it's still not ready!");
              }
              activity.postDelayed(this, FRAME_DELAY_MS);
              return;
            }

            bitmapHolder.bitmap = getActivity().getCurrentScreenshot();
            latch.countDown();
          }
        };

    getActivity().runOnUiThread(getScreenshotRunnable);
    try {
      if (!latch.await(5000, TimeUnit.MILLISECONDS)) {
        throw new RuntimeException("Timed out waiting for screenshot runnable to run!");
      }
    } catch (InterruptedException e) {
      throw new RuntimeException(e);
    }
    return Assertions.assertNotNull(bitmapHolder.bitmap);
  }

  /**
   * Implement this method to provide application key to be launched. List of available application
   * is located in TestBundle.js file
   */
  protected abstract String getReactApplicationKeyUnderTest();

  protected boolean getEnableDevSupport() {
    return false;
  }

  protected boolean isFabricTest() {
    return false;
  }

  /** Override this method to provide extra native modules to be loaded before the app starts */
  protected ReactInstanceSpecForTest createReactInstanceSpecForTest() {
    return new ReactInstanceSpecForTest();
  }

  protected ReactContext getReactContext() {
    return getActivity().getReactContext();
  }

  /** Helper class to pass the bitmap between execution scopes in {@link #getScreenshot()}. */
  private static class BitmapHolder {

    public @Nullable volatile Bitmap bitmap;
  }
}
