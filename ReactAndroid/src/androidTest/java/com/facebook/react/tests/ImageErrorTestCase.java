/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.tests;

import com.facebook.react.testing.ReactAppInstrumentationTestCase;
import com.facebook.react.testing.ReactInstanceSpecForTest;
import com.facebook.react.testing.StringRecordingModule;

/** Simple test case to check that onError does not get called with undefined */
public class ImageErrorTestCase extends ReactAppInstrumentationTestCase {

  private StringRecordingModule mStringRecordingModule;

  @Override
  protected String getReactApplicationKeyUnderTest() {
    return "ImageErrorTestApp";
  }

  public void testErrorHasCause() throws Exception {
    assertNotNull(getViewByTestId("image-1"));
    assertNotNull(getViewByTestId("image-2"));
    assertNotNull(getViewByTestId("image-3"));

    Thread.sleep(3000);

    assertEquals(3, mStringRecordingModule.getCalls().size());
    assertEquals(
        "Got error: Unsupported uri scheme! Uri is: ", mStringRecordingModule.getCalls().get(0));
    assertEquals(
        "Got error: /does/not/exist: open failed: ENOENT (No such file or directory)",
        mStringRecordingModule.getCalls().get(1));
    assertEquals(
        "Got error: Unexpected HTTP code Response{protocol=http/1.1, code=404, message=Not Found, url=https://typo_error_facebook.github.io/react/logo-og.png}",
        mStringRecordingModule.getCalls().get(2));
  }

  @Override
  protected ReactInstanceSpecForTest createReactInstanceSpecForTest() {
    mStringRecordingModule = new StringRecordingModule();
    return super.createReactInstanceSpecForTest().addNativeModule(mStringRecordingModule);
  }
}
