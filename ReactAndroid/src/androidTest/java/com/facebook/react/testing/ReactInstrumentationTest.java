/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.testing;

import android.content.Intent;
import android.test.ActivityInstrumentationTestCase2;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.JavaScriptExecutorFactory;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.testing.idledetection.IdleWaiter;

/**
 * Base class for instrumentation tests that runs React based application.
 *
 * <p>This is similar to ReactAppInstrumentationTestCase except ReactInstrumentationTest allows
 * optional rendering of components. A test case can render no components or render multiple
 * components.
 */
public abstract class ReactInstrumentationTest
    extends ActivityInstrumentationTestCase2<ReactAppTestActivity> implements IdleWaiter {

  protected StringRecordingModule mRecordingModule;

  @Nullable protected FabricUIManagerFactory mFabricUIManagerFactory = null;

  @Nullable protected JavaScriptExecutorFactory mJavaScriptExecutorFactory = null;

  public ReactInstrumentationTest() {
    super(ReactAppTestActivity.class);
  }

  @Override
  protected void setUp() throws Exception {
    super.setUp();

    Intent intent = new Intent();
    intent.putExtra(ReactAppTestActivity.EXTRA_IS_FABRIC_TEST, isFabricTest());
    setActivityIntent(intent);
    mRecordingModule = new StringRecordingModule();
    final ReactAppTestActivity activity = getActivity();
    activity.loadBundle(createReactInstanceSpecForTest(), getBundleName(), getEnableDevSupport());
  }

  /** Renders this component within this test's activity */
  public void renderComponent(final String componentName) {
    getActivity().renderComponent(componentName, null);
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

  protected boolean getEnableDevSupport() {
    return false;
  }

  protected boolean isFabricTest() {
    return false;
  }

  protected <T extends JavaScriptModule> T getJSModule(Class<T> jsInterface) {
    return getReactContext().getJSModule(jsInterface);
  }

  /** Override this method to provide extra native modules to be loaded before the app starts */
  protected ReactInstanceSpecForTest createReactInstanceSpecForTest() {
    ReactInstanceSpecForTest reactInstanceSpecForTest =
        new ReactInstanceSpecForTest().addNativeModule(mRecordingModule);
    if (mJavaScriptExecutorFactory != null) {
      reactInstanceSpecForTest.setJavaScriptExecutorFactory(mJavaScriptExecutorFactory);
    }
    if (mFabricUIManagerFactory != null) {
      reactInstanceSpecForTest.setFabricUIManagerFactory(mFabricUIManagerFactory);
    }
    return reactInstanceSpecForTest;
  }

  /** Implement this method to provide the bundle for this test */
  protected abstract String getBundleName();

  protected ReactContext getReactContext() {
    return getActivity().getReactContext();
  }
}
