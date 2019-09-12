/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.tests;

import android.widget.ScrollView;
import com.facebook.react.testing.ReactAppInstrumentationTestCase;
import com.facebook.react.testing.SingleTouchGestureGenerator;
import com.facebook.react.uimanager.PixelUtil;

/**
 * Test case to verify that JSResponder flow work correctly.
 *
 * <p>In a single test case scenario we have a view with pan gesture recognizer containing a
 * scrollview We verify that by vertical drags affects a scrollview while horizontal drags are
 * suppose to be recognized by pan responder and setJSResponder should be triggered resulting in
 * scrollview events being intercepted.
 */
public class JSResponderTestCase extends ReactAppInstrumentationTestCase {

  @Override
  protected String getReactApplicationKeyUnderTest() {
    return "JSResponderTestApp";
  }

  public void testResponderLocksScrollView() {
    ScrollView scrollView = getViewByTestId("scroll_view");
    assertNotNull(scrollView);
    assertEquals(0, scrollView.getScrollY());

    float inpx40dp = PixelUtil.toPixelFromDIP(40f);
    float inpx100dp = PixelUtil.toPixelFromDIP(100f);

    SingleTouchGestureGenerator gestureGenerator = createGestureGenerator();

    gestureGenerator
        .startGesture(30, 30 + inpx100dp)
        .dragTo(30 + inpx40dp, 30, 10, 1200)
        .endGesture(180, 100);

    waitForBridgeAndUIIdle();

    assertTrue("Expected to scroll by at least 80 dp", scrollView.getScrollY() >= inpx100dp * .8f);

    int previousScroll = scrollView.getScrollY();

    gestureGenerator
        .startGesture(30, 30 + inpx100dp)
        .dragTo(30 + inpx40dp, 30 + inpx100dp, 10, 1200);

    waitForBridgeAndUIIdle();

    gestureGenerator.dragTo(30 + inpx40dp, 30, 10, 1200).endGesture();

    waitForBridgeAndUIIdle();
    assertEquals("Expected not to scroll", scrollView.getScrollY(), previousScroll);
  }
}
