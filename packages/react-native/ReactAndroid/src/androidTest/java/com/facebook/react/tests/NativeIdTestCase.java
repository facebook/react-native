/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tests;

import android.view.View;
import com.facebook.react.testing.ReactAppInstrumentationTestCase;
import com.facebook.react.uimanager.util.ReactFindViewUtil;
import java.util.Arrays;
import java.util.List;

/**
 * Tests that the 'nativeID' property can be set on various views. The 'nativeID' property is used
 * to reference react managed views from native code.
 */
public class NativeIdTestCase extends ReactAppInstrumentationTestCase {

  @Override
  protected String getReactApplicationKeyUnderTest() {
    return "NativeIdTestApp";
  }

  private final List<String> viewTags =
      Arrays.asList(
          "Image",
          "Text",
          "TouchableBounce",
          "TouchableHighlight",
          "TouchableOpacity",
          "TouchableWithoutFeedback",
          "TextInput",
          "View");

  private boolean mViewFound;

  @Override
  protected void setUp() throws Exception {
    mViewFound = false;
    ReactFindViewUtil.addViewListener(
        new ReactFindViewUtil.OnViewFoundListener() {
          @Override
          public String getNativeId() {
            return viewTags.get(0);
          }

          @Override
          public void onViewFound(View view) {
            mViewFound = true;
          }
        });
    super.setUp();
  }

  public void testPropertyIsSetForViews() {
    for (String nativeId : viewTags) {
      View viewWithTag = ReactFindViewUtil.findView(getActivity().getRootView(), nativeId);
      assertNotNull(
          "View with nativeID " + nativeId + " was not found. Check NativeIdTestModule.js.",
          viewWithTag);
    }
  }

  public void testViewListener() {
    assertTrue("OnViewFound callback was never invoked", mViewFound);
  }

  public void testFindView() {
    mViewFound = false;
    ReactFindViewUtil.findView(
        getActivity().getRootView(),
        new ReactFindViewUtil.OnViewFoundListener() {
          @Override
          public String getNativeId() {
            return viewTags.get(0);
          }

          @Override
          public void onViewFound(View view) {
            mViewFound = true;
          }
        });
    assertTrue(
        "OnViewFound callback should have successfully been invoked synchronously", mViewFound);
  }
}
