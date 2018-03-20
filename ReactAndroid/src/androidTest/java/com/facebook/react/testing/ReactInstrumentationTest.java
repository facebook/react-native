/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.testing;

import android.content.Intent;
import android.test.ActivityInstrumentationTestCase2;
import android.view.View;
import android.view.ViewGroup;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.testing.idledetection.IdleWaiter;

/**
 * Base class for instrumentation tests that runs React based application.
 *
 * This is similar to ReactAppInstrumentationTestCase except ReactInstrumentationTest allows
 * optional rendering of components. A test case can render no components or render multiple
 * components.
 */
public abstract class ReactInstrumentationTest extends
    ActivityInstrumentationTestCase2<ReactAppTestActivity> implements IdleWaiter {

  public ReactInstrumentationTest() {
    super(ReactAppTestActivity.class);
  }

  @Override
  protected void setUp() throws Exception {
    super.setUp();

    Intent intent = new Intent();
    intent.putExtra(ReactAppTestActivity.EXTRA_IS_FABRIC_TEST, isFabricTest());
    setActivityIntent(intent);
    final ReactAppTestActivity activity = getActivity();
    try {
      runTestOnUiThread(new Runnable() {
        @Override
        public void run() {
          activity.loadBundle(
              createReactInstanceSpecForTest(),
              getBundleName(),
              getEnableDevSupport());
        }
      });
    } catch (Throwable t) {
      throw new Exception("Unable to load react bundle " + getBundleName(), t);
    }
  }

  /**
   * Renders this component within this test's activity
   */
  public void renderComponent(final String componentName) throws Exception {
    final ReactAppTestActivity activity = getActivity();
    try {
      runTestOnUiThread(new Runnable() {
        @Override
        public void run() {
          activity.renderComponent(componentName, null);
        }
      });
    } catch (Throwable t) {
      throw new Exception("Unable to render component " + componentName, t);
    }
    assertTrue("Layout never occurred!", activity.waitForLayout(5000));
    waitForBridgeAndUIIdle();
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

  public <T extends View> T getViewByTestId(String testID) {
    return (T) ReactTestHelper
        .getViewWithReactTestId((ViewGroup) getRootView().getParent(), testID);
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

  protected boolean getEnableDevSupport() {
    return false;
  }

  protected boolean isFabricTest() {
    return false;
  }

  /**
   * Override this method to provide extra native modules to be loaded before the app starts
   */
  protected ReactInstanceSpecForTest createReactInstanceSpecForTest() {
    return new ReactInstanceSpecForTest();
  }

  /**
   * Implement this method to provide the bundle for this test
   */
  protected abstract String getBundleName();

  protected ReactContext getReactContext() {
    return getActivity().getReactContext();
  }
}
