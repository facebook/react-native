/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.devsupport;

import com.facebook.react.devsupport.interfaces.StackFrame;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;

import static org.fest.assertions.api.Assertions.assertThat;
import static org.fest.assertions.api.Assertions.failBecauseExceptionWasNotThrown;

@RunWith(RobolectricTestRunner.class)
public class StackTraceHelperTest {

  @Test
  public void testParseStackFrameWithMethod() {
    final StackFrame frame = StackTraceHelper.convertJsStackTrace(
        "render@Test.bundle:1:2000")[0];
    assertThat(frame.getMethod()).isEqualTo("render");
    assertThat(frame.getFileName()).isEqualTo("Test.bundle");
    assertThat(frame.getLine()).isEqualTo(1);
    assertThat(frame.getColumn()).isEqualTo(2000);
  }

  @Test
  public void testParseStackFrameWithoutMethod() {
    final StackFrame frame = StackTraceHelper.convertJsStackTrace(
        "Test.bundle:1:2000")[0];
    assertThat(frame.getMethod()).isEqualTo("(unknown)");
    assertThat(frame.getFileName()).isEqualTo("Test.bundle");
    assertThat(frame.getLine()).isEqualTo(1);
    assertThat(frame.getColumn()).isEqualTo(2000);
  }

  @Test
  public void testParseStackFrameWithInvalidFrame() {
    try {
      StackTraceHelper.convertJsStackTrace("Test.bundle:ten:twenty");
      failBecauseExceptionWasNotThrown(IllegalArgumentException.class);
    } catch (Exception e) {
      assertThat(e).isInstanceOf(IllegalArgumentException.class);
    }
  }
}
