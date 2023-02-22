/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.tests;

import com.facebook.react.testing.ReactAppInstrumentationTestCase;
import com.facebook.react.testing.ReactInstanceSpecForTest;
import com.facebook.react.testing.StringRecordingModule;

/** Simple test to verify that layout events (onLayout) propagate to JS from native. */
public class LayoutEventsTestCase extends ReactAppInstrumentationTestCase {

  private StringRecordingModule mStringRecordingModule;

  @Override
  protected String getReactApplicationKeyUnderTest() {
    return "LayoutEventsTestApp";
  }

  /** Creates a UI in JS and verifies the onLayout handler is called. */
  public void testOnLayoutCalled() {
    assertEquals(3, mStringRecordingModule.getCalls().size());
    assertEquals("10,10-100x100", mStringRecordingModule.getCalls().get(0));
    assertEquals("10,10-50x50", mStringRecordingModule.getCalls().get(1));
    assertEquals("0,0-50x50", mStringRecordingModule.getCalls().get(2));
  }

  @Override
  protected ReactInstanceSpecForTest createReactInstanceSpecForTest() {
    mStringRecordingModule = new StringRecordingModule();
    return super.createReactInstanceSpecForTest().addNativeModule(mStringRecordingModule);
  }
}
