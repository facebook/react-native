/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tests;

import android.view.View;
import android.widget.HorizontalScrollView;
import com.facebook.react.testing.AbstractScrollViewTestCase;
import com.facebook.react.testing.SingleTouchGestureGenerator;
import com.facebook.react.uimanager.PixelUtil;
import java.util.ArrayList;

/** Integration test for horizontal ScrollView. See ScrollViewTestModule.js */
public class ReactHorizontalScrollViewTestCase extends AbstractScrollViewTestCase {

  @Override
  protected String getReactApplicationKeyUnderTest() {
    return "HorizontalScrollViewTestApp";
  }

  private void dragLeft() {
    dragLeft(200);
  }

  private void dragLeft(int durationMs) {
    createGestureGenerator()
        .startGesture(150, 50)
        .dragTo(50, 60, 10, durationMs)
        .endGesture(50, 60);
  }

  public void testScrolling() {
    HorizontalScrollView scrollView = getViewAtPath(0);
    assertNotNull(scrollView);
    assertEquals(0, scrollView.getScrollX());

    dragLeft();

    assertTrue("Expected to scroll by at least 50 pixels", scrollView.getScrollX() >= 50);
  }

  public void testScrollEvents() {
    HorizontalScrollView scrollView = getViewAtPath(0);

    dragLeft();

    waitForBridgeAndUIIdle();
    mScrollListenerModule.waitForScrollIdle();
    waitForBridgeAndUIIdle();

    ArrayList<Double> xOffsets = mScrollListenerModule.getXOffsets();
    assertFalse("Expected to receive at least one scroll event", xOffsets.isEmpty());
    assertTrue("Expected offset to be greater than 0", xOffsets.get(xOffsets.size() - 1) > 0);
    assertTrue(
        "Expected no item click event fired", mScrollListenerModule.getItemsPressed().isEmpty());
    assertEquals(
        "Expected last offset to be offset of scroll view",
        PixelUtil.toDIPFromPixel(scrollView.getScrollX()),
        xOffsets.get(xOffsets.size() - 1).doubleValue(),
        1e-5);
  }

  public void testScrollAndClick() throws Exception {
    SingleTouchGestureGenerator gestureGenerator = createGestureGenerator();

    // Slowly drag the ScrollView to prevent fling
    dragLeft(15000);

    waitForBridgeAndUIIdle();
    getInstrumentation().waitForIdleSync();

    // Find visible item to be clicked
    View visibleItem = null;
    int visibleItemNumber = 0;
    for (; visibleItemNumber < 100; visibleItemNumber++) {
      visibleItem = getViewAtPath(0, 0, visibleItemNumber);
      int pos[] = new int[2];
      visibleItem.getLocationInWindow(pos);
      if (pos[0] >= 0) {
        break;
      }
    }

    // Click first visible item
    gestureGenerator.startGesture(visibleItem).endGesture();
    waitForBridgeAndUIIdle();

    ArrayList<Double> xOffsets = mScrollListenerModule.getXOffsets();
    ArrayList<Integer> itemIds = mScrollListenerModule.getItemsPressed();
    assertFalse("Expected to receive at least one scroll event", xOffsets.isEmpty());
    assertTrue("Expected offset to be greater than 0", xOffsets.get(xOffsets.size() - 1) > 0);
    assertEquals("Expected to receive exactly one item click event", 1, itemIds.size());
    assertEquals(visibleItemNumber, (int) itemIds.get(0));
  }

  /** Verify that 'scrollTo' command makes ScrollView start scrolling */
  public void testScrollToCommand() throws Exception {
    HorizontalScrollView scrollView = getViewAtPath(0);
    ScrollViewTestModule jsModule =
        getReactContext().getCatalystInstance().getJSModule(ScrollViewTestModule.class);

    assertEquals(0, scrollView.getScrollX());

    jsModule.scrollTo(300, 0);
    waitForBridgeAndUIIdle();
    getInstrumentation().waitForIdleSync();

    // Unfortunately we need to use timeouts here in order to wait for scroll animation to happen
    // there is no better way (yet) for waiting for scroll animation to finish
    long timeout = 10000;
    long interval = 50;
    long start = System.currentTimeMillis();
    while (System.currentTimeMillis() - start < timeout) {
      if (scrollView.getScrollX() > 0) {
        break;
      }
      Thread.sleep(interval);
    }
    assertNotSame(0, scrollView.getScrollX());
  }
}
