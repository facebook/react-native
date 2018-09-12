/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tests;

import android.view.View;
import com.facebook.react.testing.ReactAppInstrumentationTestCase;

/**
 * Simple test case for passing overlayColor prop to the Image component
 */
public class ImageOverlayColorTestCase extends ReactAppInstrumentationTestCase {

  @Override
  protected String getReactApplicationKeyUnderTest() {
    return "ImageOverlayColorTestApp";
  }

  public void testOverlayColorDoesNotCrash() {
    View image = getViewByTestId("image");
    assertNotNull(image);
  }
}
