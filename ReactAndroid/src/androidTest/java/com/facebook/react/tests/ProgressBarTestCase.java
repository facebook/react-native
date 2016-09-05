/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.tests;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;

import android.content.res.Resources;
import android.util.DisplayMetrics;
import android.util.TypedValue;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.ProgressBar;

import com.facebook.react.ReactRootView;
import com.facebook.react.bridge.CatalystInstance;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.UiThreadUtil;
import com.facebook.react.modules.systeminfo.AndroidInfoModule;
import com.facebook.react.uimanager.UIImplementation;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewManager;
import com.facebook.react.views.progressbar.ReactProgressBarViewManager;
import com.facebook.react.views.view.ReactViewManager;
import com.facebook.react.testing.FakeWebSocketModule;
import com.facebook.react.testing.ReactIntegrationTestCase;
import com.facebook.react.testing.ReactTestHelper;

/**
 * Test to verify that Progress bar renders as a view of the right size
 */
public class ProgressBarTestCase extends ReactIntegrationTestCase {

  // Has same order of progressBars in ProgressBarTestModule
  private static final String[] styleList =
      new String[] {"Horizontal", "Small", "Large", "Inverse", "SmallInverse", "LargeInverse"};
  private static final HashMap<String, Integer> styles = new HashMap<String, Integer>();

  static {
    styles.put("Horizontal", android.R.attr.progressBarStyleHorizontal);
    styles.put("Small", android.R.attr.progressBarStyleSmall);
    styles.put("Large", android.R.attr.progressBarStyleLarge);
    styles.put("Inverse", android.R.attr.progressBarStyleInverse);
    styles.put("SmallInverse", android.R.attr.progressBarStyleSmallInverse);
    styles.put("LargeInverse", android.R.attr.progressBarStyleLargeInverse);
}

  private static interface ProgressBarTestModule extends JavaScriptModule {
    public void renderProgressBarApplication(int rootTag);
  }

  private UIManagerModule mUIManager;
  private CatalystInstance mInstance;
  private ReactRootView mRootView;

  @Override
  protected void setUp() throws Exception {
    super.setUp();

    List<ViewManager> viewManagers = Arrays.<ViewManager>asList(
        new ReactViewManager(),
        new ReactProgressBarViewManager());
    mUIManager = new UIManagerModule(
        getContext(),
        viewManagers,
        new UIImplementation(getContext(), viewManagers));
    UiThreadUtil.runOnUiThread(
        new Runnable() {
          @Override
          public void run() {
            mUIManager.onHostResume();
          }
        });
    waitForIdleSync();

    mInstance = ReactTestHelper.catalystInstanceBuilder(this)
        .addNativeModule(mUIManager)
        .addNativeModule(new AndroidInfoModule())
        .addNativeModule(new FakeWebSocketModule())
        .addJSModule(ProgressBarTestModule.class)
        .build();

    mRootView = new ReactRootView(getContext());
    DisplayMetrics metrics = getContext().getResources().getDisplayMetrics();
    mRootView.setLayoutParams(
        new FrameLayout.LayoutParams(metrics.widthPixels, metrics.heightPixels));
    int rootTag = mUIManager.addMeasuredRootView(mRootView);
    mInstance.getJSModule(ProgressBarTestModule.class).renderProgressBarApplication(rootTag);
    waitForBridgeAndUIIdle();
  }

  /**
   * Test that the sizes of the progressBars are setup correctly
   */
  public void testProgressBarSizes() {
    for (String style : styleList) {
      ProgressBar newProgressBar =
          new ProgressBar(getContext(), null, styles.get(style));
      final int spec = View.MeasureSpec.makeMeasureSpec(
          ViewGroup.LayoutParams.WRAP_CONTENT,
          View.MeasureSpec.UNSPECIFIED);
      newProgressBar.measure(spec, spec);
      final int expectedHeight = newProgressBar.getMeasuredHeight();

      // verify correct size of view containing ProgressBar
      View viewContainingProgressBar = getViewByTestId(mRootView, style);
      assertEquals(expectedHeight, viewContainingProgressBar.getHeight());

      assertTrue(((ViewGroup) viewContainingProgressBar).getChildAt(0) instanceof ProgressBar);
    }
  }

  public void testProgressBarWidth() {
    View viewContainingProgressBar = getViewByTestId(mRootView, "Horizontal200");
    assertEquals(viewContainingProgressBar.getWidth(), dpToPixels(200));
    ProgressBar progressBar = (ProgressBar) ((ViewGroup) viewContainingProgressBar).getChildAt(0);
    assertEquals(progressBar.getWidth(), dpToPixels(200));
  }

  private int dpToPixels(int dp) {
    Resources r = getContext().getResources();
    return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, dp, r.getDisplayMetrics());
  }
}
