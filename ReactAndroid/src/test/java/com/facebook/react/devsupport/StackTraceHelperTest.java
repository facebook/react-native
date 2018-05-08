/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport;

import static org.fest.assertions.api.Assertions.assertThat;

import com.facebook.react.devsupport.interfaces.StackFrame;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;

@RunWith(RobolectricTestRunner.class)
public class StackTraceHelperTest {

  @Test
  public void testParseAlternateFormatStackFrameWithMethod() {
    final StackFrame frame = StackTraceHelper.convertJsStackTrace(
        "at func1 (/path/to/file.js:2:18)")[0];
    assertThat(frame.getMethod()).isEqualTo("func1");
    assertThat(frame.getFileName()).isEqualTo("file.js");
    assertThat(frame.getLine()).isEqualTo(2);
    assertThat(frame.getColumn()).isEqualTo(18);
  }

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
    final StackFrame frame = StackTraceHelper.convertJsStackTrace("Test.bundle:ten:twenty")[0];
    assertThat(frame.getMethod()).isEqualTo("Test.bundle:ten:twenty");
    assertThat(frame.getFileName()).isEqualTo("");
    assertThat(frame.getLine()).isEqualTo(-1);
    assertThat(frame.getColumn()).isEqualTo(-1);
  }

  @Test
  public void testParseStackFrameWithNativeCodeFrame() {
    final StackFrame frame = StackTraceHelper.convertJsStackTrace("forEach@[native code]")[0];
    assertThat(frame.getMethod()).isEqualTo("forEach@[native code]");
    assertThat(frame.getFileName()).isEqualTo("");
    assertThat(frame.getLine()).isEqualTo(-1);
    assertThat(frame.getColumn()).isEqualTo(-1);
  }
}
