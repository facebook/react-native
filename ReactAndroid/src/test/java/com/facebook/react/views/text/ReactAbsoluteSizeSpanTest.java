/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import android.graphics.Paint;
import android.text.TextPaint;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.robolectric.RobolectricTestRunner;

@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "androidx.*", "android.*"})
public class ReactAbsoluteSizeSpanTest {
  TextPaint tp;
  Paint.FontMetrics fontMetrics;

  @Before
  public void setUp() {
    tp = mock(TextPaint.class);
    tp.baselineShift = 0;
    fontMetrics = mock(Paint.FontMetrics.class);
    fontMetrics.top = 10.0f;
    fontMetrics.bottom = -5.0f;
    when(tp.getFontMetrics()).thenReturn(fontMetrics);
    when(tp.ascent()).thenReturn(5.0f);
    when(tp.descent()).thenReturn(-2.0f);
  }

  @Test
  public void shouldNotChangeBaseline() {
    ReactAbsoluteSizeSpan absoluteSizeSpan = new ReactAbsoluteSizeSpan(15);
    TextPaint tp = new TextPaint();
    absoluteSizeSpan.updateDrawState(tp);
    assertThat(tp.baselineShift).isEqualTo(0);
  }

  // text smaller font size then other text in the span
  @Test
  public void textWithSmallerFontSizeAlignsAtTheTopOfTheLineHeight() {
    int fontSize = 15;
    ReactAbsoluteSizeSpan absoluteSizeSpan = new ReactAbsoluteSizeSpan(fontSize, "top-child");
    TextPaint tp = new TextPaint();
    int lineHeight = 10;
    int maximumFontSize = 16;
    absoluteSizeSpan.updateSpan(lineHeight, maximumFontSize);
    absoluteSizeSpan.updateDrawState(tp);
    // highestLineHeight 10 highestFontSize 16  top 10 ascent 5 bottom -5 descent -2 fontSize 15
    // 5 - 8 + 1 + 2 - 4
    // -4
    assertThat(tp.baselineShift).isEqualTo(2);
  }

  // text larger font size then other text in the span
  // aligned bottom
  /*
  @Test
  public void textWithSmallerFontSizeAlignsAtTheBottomOfTheLineHeight() {
    int fontSize = 10;
    int lineHeight = 20
    int maximumFontSize = 26;
    ReactAbsoluteSizeSpan absoluteSizeSpan = new ReactAbsoluteSizeSpan(fontSize, "bottom-child");
    TextPaint tp = new TextPaint();
    absoluteSizeSpan.updateSpan(lineHeight, maximumFontSize);
    absoluteSizeSpan.updateDrawState(tp);
    assertThat(tp.baselineShift).isEqualTo(2);
  }
  */

  @Test
  public void textWithNoLineHeightAlignsBasedOnFontMetrics() {
    int fontSize = 15;
    int lineHeight = 0;
    int maximumFontSize = 16;
    ReactAbsoluteSizeSpan absoluteSizeSpan = new ReactAbsoluteSizeSpan(fontSize, "top-child");
    absoluteSizeSpan.updateSpan(lineHeight, maximumFontSize);
    absoluteSizeSpan.updateDrawState(tp);
    // highestLineHeight 0 highestFontSize 16  top 10 ascent 5 bottom -5 descent -2 fontSize 15
    // 10 - 5 + 2 => 7
    assertThat(tp.baselineShift).isEqualTo(7);
  }
}
