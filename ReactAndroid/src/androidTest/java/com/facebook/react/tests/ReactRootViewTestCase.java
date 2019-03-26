/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tests;

import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import com.facebook.react.testing.ReactInstanceSpecForTest;
import com.facebook.react.testing.ReactAppInstrumentationTestCase;
import com.facebook.react.testing.StringRecordingModule;
import com.facebook.react.ReactRootView;

import org.junit.Ignore;

/**
 * Integration test for {@link ReactRootView}.
 */
public class ReactRootViewTestCase extends ReactAppInstrumentationTestCase {

  private StringRecordingModule mRecordingModule;

  @Override
  protected String getReactApplicationKeyUnderTest() {
    return "CatalystRootViewTestApp";
  }

  @Ignore("t6596940: fix intermittently failing test")
  public void testResizeRootView() throws Throwable {
    final ReactRootView rootView = (ReactRootView) getRootView();
    final View childView = rootView.getChildAt(0);

    assertEquals(rootView.getWidth(), childView.getWidth());

    final int newWidth = rootView.getWidth() / 2;

    runTestOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            rootView.setLayoutParams(new FrameLayout.LayoutParams(
                    newWidth,
                    ViewGroup.LayoutParams.MATCH_PARENT));
          }
        });

    getInstrumentation().waitForIdleSync();
    waitForBridgeAndUIIdle();

    assertEquals(newWidth, childView.getWidth());
  }

  /**
   * Verify that removing the root view from hierarchy will trigger subviews removal both on JS and
   * native side
   */
  public void testRemoveRootView() throws Throwable {
    final ReactRootView rootView = (ReactRootView) getRootView();

    assertEquals(1, rootView.getChildCount());

    runTestOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            ViewGroup parent = (ViewGroup) rootView.getParent();
            parent.removeView(rootView);
            // removing from parent should not remove child views, child views should be removed as
            // an effect of native call to UIManager.removeRootView
            assertEquals(1, rootView.getChildCount());
          }
        });

    getInstrumentation().waitForIdleSync();
    waitForBridgeAndUIIdle();

    assertEquals("root component should not be automatically unmounted", 0, mRecordingModule.getCalls().size());
    assertEquals(1, rootView.getChildCount());

    runTestOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            rootView.unmountReactApplication();
          }
        });
    waitForBridgeAndUIIdle();

    assertEquals(1, mRecordingModule.getCalls().size());
    assertEquals("RootComponentWillUnmount", mRecordingModule.getCalls().get(0));
    assertEquals(0, rootView.getChildCount());
  }

  @Override
  protected ReactInstanceSpecForTest createReactInstanceSpecForTest() {
    mRecordingModule = new StringRecordingModule();
    return new ReactInstanceSpecForTest()
        .addNativeModule(mRecordingModule);
  }
}
