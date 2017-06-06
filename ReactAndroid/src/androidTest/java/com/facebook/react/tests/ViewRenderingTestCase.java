/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.tests;

import java.util.Arrays;
import java.util.List;

import android.graphics.Color;
import android.view.View;
import android.view.ViewGroup;

import com.facebook.react.ReactRootView;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.modules.appstate.AppStateModule;
import com.facebook.react.modules.deviceinfo.DeviceInfoModule;
import com.facebook.react.modules.systeminfo.AndroidInfoModule;
import com.facebook.react.uimanager.PixelUtil;
import com.facebook.react.uimanager.UIImplementationProvider;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.views.view.ReactViewGroup;
import com.facebook.react.views.view.ReactViewManager;
import com.facebook.react.testing.FakeWebSocketModule;
import com.facebook.react.testing.ReactIntegrationTestCase;
import com.facebook.react.testing.ReactTestHelper;

public class ViewRenderingTestCase extends ReactIntegrationTestCase {

  private interface ViewRenderingTestModule extends JavaScriptModule {
    void renderViewApplication(int rootTag);
    void renderMarginApplication(int rootTag);
    void renderBorderApplication(int rootTag);
    void updateMargins();
    void renderTransformApplication(int rootTag);
  }

  private CatalystInstance mCatalystInstance;
  private ReactRootView mRootView;
  private int mRootTag;

  @Override
  protected void setUp() throws Exception {
    super.setUp();

    List<ViewManager> viewManagers = Arrays.<ViewManager>asList(new ReactViewManager());
    final UIManagerModule uiManager = new UIManagerModule(
        getContext(),
        viewManagers,
        new UIImplementationProvider(),
        false);
    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            uiManager.onHostResume();
          }
        });
    waitForIdleSync();

    mCatalystInstance = ReactTestHelper.catalystInstanceBuilder(this)
        .addNativeModule(uiManager)
        .addNativeModule(new AndroidInfoModule())
        .addNativeModule(new DeviceInfoModule(getContext()))
        .addNativeModule(new AppStateModule(getContext()))
        .addNativeModule(new FakeWebSocketModule())
        .addJSModule(ViewRenderingTestModule.class)
        .build();

    mRootView = new ReactRootView(getContext());
    mRootTag = uiManager.addRootView(mRootView);
  }

  public void testViewRenderedWithCorrectProperties() {
    float expectedOpacity = 0.75f;
    int expectedBackgroundColor = Color.rgb(255, 0, 0);

    mCatalystInstance.getJSModule(ViewRenderingTestModule.class).renderViewApplication(mRootTag);
    waitForBridgeAndUIIdle();

    ReactViewGroup view = getViewAtPath(mRootView);
    assertEquals("Incorrect (or not applied) opacity", expectedOpacity, view.getAlpha());
    assertEquals(
        "Incorrect (or not applied) backgroundColor",
        expectedBackgroundColor,
        view.getBackgroundColor());
  }

  public void testMarginsApplied() {
    mCatalystInstance.getJSModule(ViewRenderingTestModule.class).renderMarginApplication(mRootTag);
    waitForBridgeAndUIIdle();

    View view = getViewAtPath(mRootView);

    int expectedMargin = Math.round(PixelUtil.toPixelFromDIP(10));
    int expectedMarginLeft = Math.round(PixelUtil.toPixelFromDIP(20));

    assertEquals(expectedMarginLeft, (int) view.getX());
    assertEquals(expectedMargin, (int) view.getY());
  }

  public void testMarginUpdateDoesntForgetPreviousValue() {
    mCatalystInstance.getJSModule(ViewRenderingTestModule.class).renderMarginApplication(mRootTag);
    waitForBridgeAndUIIdle();

    View view = getViewAtPath(mRootView);

    // before: margin: 10, marginLeft: 20
    mCatalystInstance.getJSModule(ViewRenderingTestModule.class).updateMargins();
    waitForBridgeAndUIIdle();
    // after: margin: 15; it should not forget marginLeft was set to 20

    int expectedMargin = Math.round(PixelUtil.toPixelFromDIP(15));
    int expectedMarginLeft = Math.round(PixelUtil.toPixelFromDIP(20));

    assertEquals(expectedMarginLeft, (int) view.getX());
    assertEquals(expectedMargin, (int) view.getY());
  }

  public void testBordersApplied() {
    mCatalystInstance.getJSModule(ViewRenderingTestModule.class).renderBorderApplication(mRootTag);
    waitForBridgeAndUIIdle();

    View view = getViewAtPath(mRootView);
    View child = ((ViewGroup) view).getChildAt(0);

    int expectedBorderX = Math.round(PixelUtil.toPixelFromDIP(20));
    int expectedBorderY = Math.round(PixelUtil.toPixelFromDIP(5));

    assertEquals(expectedBorderX, (int) child.getX());
    assertEquals(expectedBorderY, (int) child.getY());
  }

  public void testTransformations() {
    mCatalystInstance.getJSModule(ViewRenderingTestModule.class)
        .renderTransformApplication(mRootTag);
    waitForBridgeAndUIIdle();

    View view = getViewAtPath(mRootView);

    float expectedTranslateX = PixelUtil.toPixelFromDIP(20);
    float expectedTranslateY = PixelUtil.toPixelFromDIP(25);

    assertEquals(5f, view.getScaleX());
    assertEquals(10f, view.getScaleY());
    assertEquals(15f, view.getRotation());
    assertEquals(expectedTranslateX, view.getTranslationX());
    assertEquals(expectedTranslateY, view.getTranslationY());
  }
}
