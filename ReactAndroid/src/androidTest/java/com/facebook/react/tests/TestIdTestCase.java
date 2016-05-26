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

import com.facebook.react.views.picker.ReactDropdownPickerManager;
import com.facebook.react.testing.ReactAppInstrumentationTestCase;
import com.facebook.react.testing.ReactInstanceSpecForTest;
import com.facebook.react.testing.ReactTestHelper;


/**
 * Tests that the 'testID' property can be set on various views.
 * The 'testID' property is used to locate views in UI tests.
 */
public class TestIdTestCase extends ReactAppInstrumentationTestCase {

  @Override
  protected String getReactApplicationKeyUnderTest() {
    return "TestIdTestApp";
  }

  private final List<String> viewTags = Arrays.asList(
      "Image",
      "ProgressBar",
      "ScrollView",
      "Horizontal ScrollView",
      "Dropdown Picker",
      "Dialog Picker",
      "Switch",
      "Text",
      "TouchableBounce",
      "TouchableHighlight",
      "TouchableOpacity",
      "TouchableWithoutFeedback",
      "Toolbar",
      "TextInput",
      "View",
      // "WebView", TODO t11449130
      "ScrollView Item (same id used for all items)"
      );

  public void testPropertyIsSetForViews() {
    for (String tag : viewTags) {
      View viewWithTag = ReactTestHelper.getViewWithReactTestId(
        getActivity().getRootView(),
        tag);
      assertNotNull(
          "View with testID tag " + tag + " was not found. Check TestIdTestModule.js.",
          viewWithTag);
    }
  }
}
