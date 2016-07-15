/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.tests;

import java.util.ArrayList;
import java.util.List;

import android.content.Context;
import javax.annotation.Nullable;
import android.widget.ScrollView;

import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.testing.ReactAppInstrumentationTestCase;
import com.facebook.react.testing.ReactInstanceSpecForTest;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.views.view.ReactViewGroup;
import com.facebook.react.views.view.ReactViewManager;

import org.junit.Assert;
import org.junit.Ignore;

/**
 * Integration test for {@code removeClippedSubviews} property that verify correct scrollview
 * behavior
 */
public class CatalystSubviewsClippingTestCase extends ReactAppInstrumentationTestCase {

  private interface SubviewsClippingTestModule extends JavaScriptModule {
    void renderClippingSample1();
    void renderClippingSample2();
    void renderScrollViewTest();
    void renderUpdatingSample1(boolean update1, boolean update2);
    void renderUpdatingSample2(boolean update);
  }

  private final List<String> mEvents = new ArrayList<>();

  @Override
  protected String getReactApplicationKeyUnderTest() {
    return "SubviewsClippingTestApp";
  }

  @Override
  protected ReactInstanceSpecForTest createReactInstanceSpecForTest() {
    ReactInstanceSpecForTest instanceSpec = new ReactInstanceSpecForTest();
    instanceSpec.addJSModule(SubviewsClippingTestModule.class);
    instanceSpec.addViewManager(new ClippableViewManager(mEvents));
    return instanceSpec;
  }

  /**
   * In this test view are layout in a following way:
   * +-----------------------------+
   * |                             |
   * |   +---------------------+   |
   * |   | inner1              |   |
   * |   +---------------------+   |
   * | +-------------------------+ |
   * | | outer (clip=true)       | |
   * | | +---------------------+ | |
   * | | | inner2              | | |
   * | | +---------------------+ | |
   * | |                         | |
   * | +-------------------------+ |
   * |   +---------------------+   |
   * |   | inner3              |   |
   * |   +---------------------+   |
   * |                             |
   * +-----------------------------+
   *
   * We expect only outer and inner2 to be attached
   */
  public void XtestOneLevelClippingInView() throws Throwable {
    mEvents.clear();
    getReactContext().getJSModule(SubviewsClippingTestModule.class).renderClippingSample1();
    waitForBridgeAndUIIdle();
    Assert.assertArrayEquals(new String[]{"Attach_outer", "Attach_inner2"}, mEvents.toArray());
  }

  /**
   * In this test view are layout in a following way:
   * +-----------------------------+
   * | outer (clip=true)           |
   * |                             |
   * |                             |
   * |                             |
   * |              +-----------------------------+
   * |              | complexInner (clip=true)    |
   * |              | +----------+ | +---------+  |
   * |              | | inner1   | | | inner2  |  |
   * |              | |          | | |         |  |
   * |              | +----------+ | +---------+  |
   * +--------------+--------------+              |
   *                | +----------+   +---------+  |
   *                | | inner3   |   | inner4  |  |
   *                | |          |   |         |  |
   *                | +----------+   +---------+  |
   *                |                             |
   *                +-----------------------------+
   *
   * We expect outer, complexInner & inner1 to be attached
   */
  public void XtestTwoLevelClippingInView() throws Throwable {
    mEvents.clear();
    getReactContext().getJSModule(SubviewsClippingTestModule.class).renderClippingSample2();
    waitForBridgeAndUIIdle();
    Assert.assertArrayEquals(
        new String[]{"Attach_outer", "Attach_complexInner", "Attach_inner1"},
        mEvents.toArray());
  }

  /**
   * This test verifies that we update clipped subviews appropriately when some of them gets
   * re-layouted.
   *
   * In this test scenario we render clipping view ("outer") with two subviews, one is outside and
   * clipped and one is inside (absolutely positioned). By updating view props we first change the
   * height of the first element so that it should intersect with clipping "outer" view. Then we
   * update top position of the second view so that is should go off screen.
   */
  public void testClippingAfterLayoutInner() {
    SubviewsClippingTestModule subviewsClippingTestModule =
        getReactContext().getJSModule(SubviewsClippingTestModule.class);

    mEvents.clear();
    subviewsClippingTestModule.renderUpdatingSample1(false, false);
    waitForBridgeAndUIIdle();
    Assert.assertArrayEquals(new String[]{"Attach_outer", "Attach_inner2"}, mEvents.toArray());

    mEvents.clear();
    subviewsClippingTestModule.renderUpdatingSample1(true, false);
    waitForBridgeAndUIIdle();
    Assert.assertArrayEquals(new String[]{"Attach_inner1"}, mEvents.toArray());

    mEvents.clear();
    subviewsClippingTestModule.renderUpdatingSample1(true, true);
    waitForBridgeAndUIIdle();
    Assert.assertArrayEquals(new String[]{"Detach_inner2"}, mEvents.toArray());
  }

  /**
   * This test verifies that we update clipping views appropriately when parent view layout changes
   * in a way that affects clipping.
   *
   * In this test we render clipping view ("outer") set to be 100x100dp with inner view that is
   * absolutely positioned out of the clipping area of the parent view. Then we resize parent view
   * so that inner view should be visible.
   */
  public void testClippingAfterLayoutParent() {
    SubviewsClippingTestModule subviewsClippingTestModule =
        getReactContext().getJSModule(SubviewsClippingTestModule.class);

    mEvents.clear();
    subviewsClippingTestModule.renderUpdatingSample2(false);
    waitForBridgeAndUIIdle();
    Assert.assertArrayEquals(new String[]{"Attach_outer"}, mEvents.toArray());

    mEvents.clear();
    subviewsClippingTestModule.renderUpdatingSample2(true);
    waitForBridgeAndUIIdle();
    Assert.assertArrayEquals(new String[]{"Attach_inner"}, mEvents.toArray());
  }

  public void testOneLevelClippingInScrollView() throws Throwable {
    getReactContext().getJSModule(SubviewsClippingTestModule.class).renderScrollViewTest();
    waitForBridgeAndUIIdle();

    // Only 3 first views should be attached at the beginning
    Assert.assertArrayEquals(new String[]{"Attach_0", "Attach_1", "Attach_2"}, mEvents.toArray());
    mEvents.clear();

    // We scroll down such that first view get out of the bounds, we expect the first view to be
    // detached and 4th view to get attached
    scrollToDpInUIThread(120);
    Assert.assertArrayEquals(new String[]{"Detach_0", "Attach_3"}, mEvents.toArray());
  }

  public void testTwoLevelClippingInScrollView() throws Throwable {
    getReactContext().getJSModule(SubviewsClippingTestModule.class).renderScrollViewTest();
    waitForBridgeAndUIIdle();

    final int complexViewOffset = 4 * 120 - 300;

    // Step 1
    // We scroll down such that first "complex" view is clipped & just below the bottom of the
    // scroll view
    scrollToDpInUIThread(complexViewOffset);

    mEvents.clear();

    // Step 2
    // Scroll a little bit so that "complex" view is visible, but it's inner views are not
    scrollToDpInUIThread(complexViewOffset + 5);

    Assert.assertArrayEquals(new String[]{"Attach_C0"}, mEvents.toArray());
    mEvents.clear();

    // Step 3
    // Scroll even more so that first subview of "complex" view is visible, view 1 will get off
    // screen
    scrollToDpInUIThread(complexViewOffset + 100);
    Assert.assertArrayEquals(new String[]{"Detach_1", "Attach_C0.1"}, mEvents.toArray());
    mEvents.clear();

    // Step 4
    // Scroll even more to reveal second subview of "complex" view
    scrollToDpInUIThread(complexViewOffset + 150);
    Assert.assertArrayEquals(new String[]{"Attach_C0.2"}, mEvents.toArray());
    mEvents.clear();

    // Step 5
    // Scroll back to previous position (Step 3), second view should get detached
    scrollToDpInUIThread(complexViewOffset + 100);
    Assert.assertArrayEquals(new String[]{"Detach_C0.2"}, mEvents.toArray());
    mEvents.clear();

    // Step 6
    // Scroll back to Step 2, complex view should be visible but all subviews should be detached
    scrollToDpInUIThread(complexViewOffset + 5);
    Assert.assertArrayEquals(new String[]{"Attach_1", "Detach_C0.1"}, mEvents.toArray());
    mEvents.clear();

    // Step 7
    // Scroll back to Step 1, complex view should be gone
    scrollToDpInUIThread(complexViewOffset);
    Assert.assertArrayEquals(new String[]{"Detach_C0"}, mEvents.toArray());
  }

  private void scrollToDpInUIThread(final int yPositionInDP) throws Throwable {
    final ScrollView mainScrollView = getViewByTestId("scroll_view");
    runTestOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            mainScrollView.scrollTo(0, (int) PixelUtil.toPixelFromDIP(yPositionInDP));
          }
        });
    waitForBridgeAndUIIdle();
  }

  private static class ClippableView extends ReactViewGroup {

    private String mClippableViewID;
    private final List<String> mEvents;

    public ClippableView(Context context, List<String> events) {
      super(context);
      mEvents = events;
    }

    @Override
    protected void onAttachedToWindow() {
      super.onAttachedToWindow();
      mEvents.add("Attach_" + mClippableViewID);
    }

    @Override
    protected void onDetachedFromWindow() {
      super.onDetachedFromWindow();
      mEvents.add("Detach_" + mClippableViewID);
    }

    public void setClippableViewID(String clippableViewID) {
      mClippableViewID = clippableViewID;
    }
  }

  private static class ClippableViewManager extends ReactViewManager {

    private final List<String> mEvents;

    public ClippableViewManager(List<String> events) {
      mEvents = events;
    }

    @Override
    public String getName() {
      return "ClippableView";
    }

    @Override
    public ReactViewGroup createViewInstance(ThemedReactContext context) {
      return new ClippableView(context, mEvents);
    }

    @ReactProp(name = "clippableViewID")
    public void setClippableViewId(ReactViewGroup view, @Nullable String clippableViewId) {
      ((ClippableView) view).setClippableViewID(clippableViewId);
    }
  }
}
