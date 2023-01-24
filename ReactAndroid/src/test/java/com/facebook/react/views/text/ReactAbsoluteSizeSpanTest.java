/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import static org.assertj.core.api.Assertions.assertThat;

import android.text.TextPaint;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.robolectric.RobolectricTestRunner;

@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "androidx.*", "android.*"})
public class ReactAbsoluteSizeSpanTest {

  @Test
  public void shouldNotChangeBaseline() {
    ReactAbsoluteSizeSpan absoluteSizeSpan = new ReactAbsoluteSizeSpan(15);
    TextPaint tp = new TextPaint();
    absoluteSizeSpan.updateDrawState(tp);
    assertThat(tp.baselineShift).isEqualTo(0);
  }

  @Test
  public void textWithSmallerFontSizeAlignsAtTheTopOfTheLineHeight() {
    int fontSize = 15;
    ReactAbsoluteSizeSpan absoluteSizeSpan = new ReactAbsoluteSizeSpan(fontSize, "top-child");
    TextPaint tp = new TextPaint();
    int lineHeight = 10;
    int maximumFontSize = 16;
    absoluteSizeSpan.updateSpan(lineHeight, maximumFontSize);
    absoluteSizeSpan.updateDrawState(tp);
    assertThat(tp.baselineShift).isEqualTo(2);
  }

  @Test
  public void textWithNoLineHeightAlignsBasedOnFontMetrics() {
    int fontSize = 15;
    ReactAbsoluteSizeSpan absoluteSizeSpan = new ReactAbsoluteSizeSpan(fontSize, "top-child");
    TextPaint tp = new TextPaint();
    int lineHeight = 0;
    int maximumFontSize = 16;
    absoluteSizeSpan.updateSpan(lineHeight, maximumFontSize);
    absoluteSizeSpan.updateDrawState(tp);
    assertThat(tp.baselineShift).isEqualTo(2);
  }
}
