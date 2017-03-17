/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.tests;

import java.util.Arrays;
import java.util.List;

import android.util.DisplayMetrics;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.TextView;

import com.facebook.react.ReactRootView;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.modules.appstate.AppStateModule;
import com.facebook.react.modules.deviceinfo.DeviceInfoModule;
import com.facebook.react.modules.systeminfo.AndroidInfoModule;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.UIImplementation;
import com.facebook.react.uimanager.UIImplementationProvider;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.views.text.ReactRawTextManager;
import com.facebook.react.views.text.ReactTextViewManager;
import com.facebook.react.views.view.ReactViewManager;
import com.facebook.react.testing.FakeWebSocketModule;
import com.facebook.react.testing.ReactIntegrationTestCase;
import com.facebook.react.testing.ReactTestHelper;

/**
 * Test case for basic {@link UIManagerModule} functionality.
 */
public class CatalystUIManagerTestCase extends ReactIntegrationTestCase {
  private interface UIManagerTestModule extends JavaScriptModule {
    void renderFlexTestApplication(int rootTag);
    void renderFlexWithTextApplication(int rootTag);
    void renderAbsolutePositionTestApplication(int rootTag);
    void renderAbsolutePositionBottomRightTestApplication(int rootTag);
    void renderCenteredTextViewTestApplication(int rootTag, String text);
    void renderUpdatePositionInListTestApplication(int rootTag);
    void flushUpdatePositionInList();
  }

  private UIManagerTestModule jsModule;
  private UIManagerModule uiManager;

  private int inPixelRounded(int val) {
    return Math.round(PixelUtil.toPixelFromDIP(val));
  }

  private boolean isWithinRange(float value, float lower, float upper) {
    return value >= lower && value <= upper;
  }

  private ReactRootView createRootView() {
    ReactRootView rootView = new ReactRootView(getContext());
    final DisplayMetrics metrics = getContext().getResources().getDisplayMetrics();
    rootView.setLayoutParams(
        new FrameLayout.LayoutParams(metrics.widthPixels, metrics.heightPixels));
    uiManager.addMeasuredRootView(rootView);
    // We add the root view by posting to the main thread so wait for that to complete so that the
    // root view tag is added to the view
    waitForIdleSync();
    return rootView;
  }

  @Override
  protected void setUp() throws Exception {
    super.setUp();

    List<ViewManager> viewManagers = Arrays.<ViewManager>asList(
        new ReactViewManager(),
        new ReactTextViewManager(),
        new ReactRawTextManager());
    uiManager = new UIManagerModule(
        getContext(),
        viewManagers,
        new UIImplementationProvider(),
        false);
    UiThreadUtil.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        uiManager.onHostResume();
      }
    });
    waitForIdleSync();

    jsModule = ReactTestHelper.catalystInstanceBuilder(this)
        .addNativeModule(uiManager)
        .addNativeModule(new AndroidInfoModule())
        .addNativeModule(new DeviceInfoModule(getContext()))
        .addNativeModule(new AppStateModule(getContext()))
        .addNativeModule(new FakeWebSocketModule())
        .addJSModule(UIManagerTestModule.class)
        .build()
        .getJSModule(UIManagerTestModule.class);
  }

  public void testFlexUIRendered() {
    FrameLayout rootView = createRootView();
    jsModule.renderFlexTestApplication(rootView.getId());
    waitForBridgeAndUIIdle();

    assertEquals(1, rootView.getChildCount());

    ViewGroup container = getViewByTestId(rootView, "container");
    assertEquals(inPixelRounded(200), container.getWidth());
    assertEquals(inPixelRounded(200), container.getHeight());
    assertEquals(2, container.getChildCount());

    View child0 = container.getChildAt(0);
    assertEquals(inPixelRounded(100), child0.getWidth());
    assertEquals(inPixelRounded(200), child0.getHeight());

    View child1 = container.getChildAt(1);
    assertEquals(inPixelRounded(100), child1.getWidth());
    assertEquals(inPixelRounded(200), child1.getHeight());
  }

  // TODO t13583009
  // Breaks OSS CI but runs fine locally
  // Find what could be different and make the test independent of env
  // public void testFlexWithTextViews() {
  //   FrameLayout rootView = createRootView();
  //   jsModule.renderFlexWithTextApplication(rootView.getId());
  //   waitForBridgeAndUIIdle();
  //
  //   assertEquals(1, rootView.getChildCount());
  //
  //   ViewGroup container = getViewByTestId(rootView, "container");
  //   assertEquals(inPixelRounded(300), container.getHeight());
  //   assertEquals(1, container.getChildCount());
  //
  //   ViewGroup row = (ViewGroup) container.getChildAt(0);
  //   assertEquals(inPixelRounded(300), row.getHeight());
  //   assertEquals(2, row.getChildCount());
  //
  //   // Text measurement adds padding that isn't completely dependent on density so we can't easily
  //   // get an exact value here
  //   float approximateExpectedTextHeight = inPixelRounded(19);
  //   View leftText = row.getChildAt(0);
  //   assertTrue(
  //       isWithinRange(
  //           leftText.getHeight(),
  //           approximateExpectedTextHeight - PixelUtil.toPixelFromDIP(1),
  //           approximateExpectedTextHeight + PixelUtil.toPixelFromDIP(1)));
  //   assertEquals(row.getWidth() / 2 - inPixelRounded(20), leftText.getWidth());
  //   assertEquals(inPixelRounded(290), (leftText.getTop() + leftText.getHeight()));
  //
  //   View rightText = row.getChildAt(1);
  //   assertTrue(
  //       isWithinRange(
  //           rightText.getHeight(),
  //           approximateExpectedTextHeight - PixelUtil.toPixelFromDIP(1),
  //           approximateExpectedTextHeight + PixelUtil.toPixelFromDIP(1)));
  //   assertEquals(leftText.getWidth(), rightText.getWidth());
  //   assertEquals(leftText.getTop(), rightText.getTop());
  //   assertEquals(leftText.getWidth() + inPixelRounded(30), rightText.getLeft());
  // }

  public void testAbsolutePositionUIRendered() {
    FrameLayout rootView = createRootView();
    jsModule.renderAbsolutePositionTestApplication(rootView.getId());
    waitForBridgeAndUIIdle();

    assertEquals(1, rootView.getChildCount());

    View absoluteView = getViewByTestId(rootView, "absolute");
    assertEquals(inPixelRounded(50), absoluteView.getWidth());
    assertEquals(inPixelRounded(60), absoluteView.getHeight());
    assertEquals(inPixelRounded(10), absoluteView.getLeft());
    assertEquals(inPixelRounded(15), absoluteView.getTop());
  }

  public void testUpdatePositionInList() {
    FrameLayout rootView = createRootView();
    jsModule.renderUpdatePositionInListTestApplication(rootView.getId());
    waitForBridgeAndUIIdle();

    ViewGroup containerView = getViewByTestId(rootView, "container");
    View c0 = containerView.getChildAt(0);
    View c1 = containerView.getChildAt(1);
    View c2 = containerView.getChildAt(2);

    assertEquals(inPixelRounded(10), c0.getHeight());
    assertEquals(inPixelRounded(0), c0.getTop());
    assertEquals(inPixelRounded(10), c1.getHeight());
    assertEquals(inPixelRounded(10), c1.getTop());
    assertEquals(inPixelRounded(10), c2.getHeight());
    assertEquals(inPixelRounded(20), c2.getTop());

    // Let's make the second elements 50px height instead of 10px
    jsModule.flushUpdatePositionInList();
    waitForBridgeAndUIIdle();

    assertEquals(inPixelRounded(10), c0.getHeight());
    assertEquals(inPixelRounded(0), c0.getTop());
    assertEquals(inPixelRounded(50), c1.getHeight());
    assertEquals(inPixelRounded(10), c1.getTop());
    assertEquals(inPixelRounded(10), c2.getHeight());
    assertEquals(inPixelRounded(60), c2.getTop());
  }

  public void testAbsolutePositionBottomRightUIRendered() {
    FrameLayout rootView = createRootView();
    jsModule.renderAbsolutePositionBottomRightTestApplication(rootView.getId());
    waitForBridgeAndUIIdle();

    assertEquals(1, rootView.getChildCount());

    ViewGroup containerView = getViewByTestId(rootView, "container");
    View absoluteView = containerView.getChildAt(0);

    assertEquals(inPixelRounded(50), absoluteView.getWidth());
    assertEquals(inPixelRounded(60), absoluteView.getHeight());
    assertEquals(inPixelRounded(100 - 50 - 10), Math.round(absoluteView.getLeft()));
    assertEquals(inPixelRounded(100 - 60 - 15), Math.round(absoluteView.getTop()));
  }

  public void _testCenteredText(String text) {
    ReactRootView rootView = new ReactRootView(getContext());
    int rootTag = uiManager.addMeasuredRootView(rootView);

    jsModule.renderCenteredTextViewTestApplication(rootTag, text);
    waitForBridgeAndUIIdle();

    TextView textView = getViewByTestId(rootView, "text");

    // text view should be centered
    String msg = "text `" + text + "` is not centered";
    assertTrue(msg, textView.getLeft() > 0.1);
    assertTrue(msg, textView.getTop() > 0.1);
    assertEquals(
        msg,
        (int) Math.ceil((inPixelRounded(200) - textView.getWidth()) * 0.5f),
        textView.getLeft());
    assertEquals(
        msg,
        (int) Math.ceil((inPixelRounded(100) - textView.getHeight()) * 0.5f),
        textView.getTop());
  }

  public void testCenteredTextCases() {
    String[] cases = new String[] {
      "test",
      "with whitespace",
    };
    for (String text : cases) {
      _testCenteredText(text);
    }
  }
}
