/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.tests;

import android.view.View;
import com.facebook.react.testing.ReactAppInstrumentationTestCase;
import com.facebook.react.testing.ReactTestHelper;
import java.util.Arrays;
import java.util.List;

/**
 * Tests that the 'testID' property can be set on various views. The 'testID' property is used to
 * locate views in UI tests.
 */
public class TestIdTestCase extends ReactAppInstrumentationTestCase {

  @Override
  protected String getReactApplicationKeyUnderTest() {
    return "TestIdTestApp";
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

  public void testPropertyIsSetForViews() {
    for (String tag : viewTags) {
      View viewWithTag = ReactTestHelper.getViewWithReactTestId(getActivity().getRootView(), tag);
      assertNotNull(
          "View with testID tag " + tag + " was not found. Check TestIdTestModule.js.",
          viewWithTag);
    }
  }
}
