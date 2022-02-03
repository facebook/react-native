/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tests;

import android.view.View;
import com.facebook.react.testing.ReactAppInstrumentationTestCase;
import com.facebook.react.testing.ReactInstanceSpecForTest;
import com.facebook.react.testing.ReactTestHelper;
import com.facebook.react.testing.StringRecordingModule;

/**
 * Integration test for {@code removeClippedSubviews} property that verify correct scrollview
 * behavior
 */
public class AnimatedTransformTest extends ReactAppInstrumentationTestCase {

  private StringRecordingModule mStringRecordingModule;

  @Override
  protected String getReactApplicationKeyUnderTest() {
    return "AnimatedTransformTestApp";
  }

  @Override
  protected ReactInstanceSpecForTest createReactInstanceSpecForTest() {
    mStringRecordingModule = new StringRecordingModule();
    return super.createReactInstanceSpecForTest().addNativeModule(mStringRecordingModule);
  }

  public void testAnimatedRotation() {
    waitForBridgeAndUIIdle();

    View button =
        ReactTestHelper.getViewWithReactTestId(getActivity().getRootView(), "TouchableOpacity");

    // Tap the button which triggers the animated transform containing the
    // rotation strings.
    createGestureGenerator().startGesture(button).endGesture();
    waitForBridgeAndUIIdle();

    // The previous cast error will prevent it from getting here
    assertEquals(2, mStringRecordingModule.getCalls().size());
  }
}
