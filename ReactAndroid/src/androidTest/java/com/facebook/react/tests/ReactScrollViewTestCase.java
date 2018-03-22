/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.tests;

import java.util.ArrayList;

import android.view.View;
import android.widget.ScrollView;

import com.facebook.react.testing.AbstractScrollViewTestCase;
import com.facebook.react.testing.SingleTouchGestureGenerator;
import com.facebook.react.uimanager.PixelUtil;

/**
 * Integration test for vertical ScrollView.
 * See ScrollViewTestModule.js
 */
public class ReactScrollViewTestCase extends AbstractScrollViewTestCase {

  @Override
  protected String getReactApplicationKeyUnderTest() {
    return "ScrollViewTestApp";
  }

  private void dragUp() {
    dragUp(200);
  }

  private void dragUp(int durationMs) {
    createGestureGenerator()
        .startGesture(200, 200)
        .dragTo(180, 100, 10, durationMs)
        .endGesture(180, 100);
  }

  public void testScrolling() {
    ScrollView scrollView = getViewAtPath(0);
    assertNotNull(scrollView);
    assertEquals(0, scrollView.getScrollY());

    dragUp();

    assertTrue("Expected to scroll by at least 50 pixels", scrollView.getScrollY() >= 50);
  }

  public void testScrollEvents() {
    ScrollView scrollView = getViewAtPath(0);

    dragUp();

    waitForBridgeAndUIIdle();
    mScrollListenerModule.waitForScrollIdle();
    waitForBridgeAndUIIdle();

    ArrayList<Double> yOffsets = mScrollListenerModule.getYOffsets();
    assertFalse("Expected to receive at least one scroll event", yOffsets.isEmpty());
    assertTrue("Expected offset to be greater than 0", yOffsets.get(yOffsets.size() - 1) > 0);
    assertTrue(
        "Expected no item click event fired",
        mScrollListenerModule.getItemsPressed().isEmpty());
    assertEquals(
        "Expected last offset to be offset of scroll view",
        PixelUtil.toDIPFromPixel(scrollView.getScrollY()),
        yOffsets.get(yOffsets.size() - 1).doubleValue(),
        1e-5);
    assertTrue("Begin and End Drag should be called", mScrollListenerModule.dragEventsMatch());
  }

  public void testScrollAndClick() throws Exception {
    SingleTouchGestureGenerator gestureGenerator = createGestureGenerator();

    // Slowly drag the ScrollView to prevent fling
    dragUp(15000);

    waitForBridgeAndUIIdle();
    getInstrumentation().waitForIdleSync();

    // Find visible item to be clicked
    View visibleItem = null;
    int visibleItemNumber = 0;
    for (; visibleItemNumber < 100; visibleItemNumber++) {
      visibleItem = getViewAtPath(0, 0, visibleItemNumber);
      int pos[] = new int[2];
      visibleItem.getLocationInWindow(pos);
      if (pos[1] >= 0) {
        break;
      }
    }

    // Click first visible item
    gestureGenerator.startGesture(visibleItem).endGesture();
    waitForBridgeAndUIIdle();

    ArrayList<Double> yOffsets = mScrollListenerModule.getYOffsets();
    ArrayList<Integer> itemIds = mScrollListenerModule.getItemsPressed();
    assertFalse("Expected to receive at least one scroll event", yOffsets.isEmpty());
    assertTrue("Expected offset to be greater than 0", yOffsets.get(yOffsets.size() - 1) > 0);
    assertEquals("Expected to receive exactly one item click event", 1, itemIds.size());
    assertEquals(visibleItemNumber, (int) itemIds.get(0));
  }

  /**
   * Verify that 'scrollTo' command makes ScrollView start scrolling
   */
  public void testScrollToCommand() throws Exception {
    ScrollView scrollView = getViewAtPath(0);
    ScrollViewTestModule jsModule =
        getReactContext().getCatalystInstance().getJSModule(ScrollViewTestModule.class);

    assertEquals(0, scrollView.getScrollY());

    jsModule.scrollTo(0, 300);
    waitForBridgeAndUIIdle();
    getInstrumentation().waitForIdleSync();

    // Unfortunately we need to use timeouts here in order to wait for scroll animation to happen
    // there is no better way (yet) for waiting for scroll animation to finish
    long timeout = 10000;
    long interval = 50;
    long start = System.currentTimeMillis();
    while (System.currentTimeMillis() - start < timeout) {
      if (scrollView.getScrollY() > 0) {
        break;
      }
      Thread.sleep(interval);
    }
    assertNotSame(0, scrollView.getScrollY());
    assertFalse("Drag should not be called with scrollTo", mScrollListenerModule.dragEventsMatch());
  }
}
