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

import android.view.View;

import com.facebook.react.testing.ReactAppInstrumentationTestCase;
import com.facebook.react.uimanager.util.ReactFindViewUtil;

/**
 * Tests that the 'nativeID' property can be set on various views.
 * The 'nativeID' property is used to reference react managed views from native code.
 */
public class NativeIdTestCase extends ReactAppInstrumentationTestCase {

  @Override
  protected String getReactApplicationKeyUnderTest() {
    return "NativeIdTestApp";
  }

  private final List<String> viewTags = Arrays.asList(
    "Image",
    "Text",
    "TouchableBounce",
    "TouchableHighlight",
    "TouchableOpacity",
    "TouchableWithoutFeedback",
    "TextInput",
    "View");

  public void testPropertyIsSetForViews() {
    for (String nativeId : viewTags) {
      View viewWithTag = ReactFindViewUtil.findViewByNativeId(
        getActivity().getRootView(),
        nativeId);
      assertNotNull(
        "View with nativeID " + nativeId + " was not found. Check NativeIdTestModule.js.",
        viewWithTag);
    }
  }
}
