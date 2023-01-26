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
    // https://stackoverflow.com/a/27631737/7295772
    // top      -------------  -10
    // ascent   -------------  -5
    // baseline __my Text____   0
    // descent  _____________   2
    // bottom   _____________   5
    tp = mock(TextPaint.class);
    tp.baselineShift = 0;
    fontMetrics = mock(Paint.FontMetrics.class);
    fontMetrics.top = -10.0f;
    fontMetrics.ascent = -5.0f;
    fontMetrics.descent = 2.0f;
    fontMetrics.bottom = 5.0f;
    when(tp.getFontMetrics()).thenReturn(fontMetrics);
    when(tp.ascent()).thenReturn(fontMetrics.ascent);
    when(tp.descent()).thenReturn(fontMetrics.descent);
  }

  @Test
  public void shouldNotChangeBaseline() {
    ReactAbsoluteSizeSpan absoluteSizeSpan = new ReactAbsoluteSizeSpan(15);
    absoluteSizeSpan.updateDrawState(tp);
    assertThat(tp.baselineShift).isEqualTo(0);
  }

  // text with smaller font size then other spans
  @Test
  public void textWithSmallerFontSizeAlignsAtTheTopOfTheLineHeight() {
    int fontSize = 15;
    ReactAbsoluteSizeSpan absoluteSizeSpan = new ReactAbsoluteSizeSpan(fontSize, "top-child");
    int lineHeight = 10;
    int maximumFontSize = 16;
    absoluteSizeSpan.updateSpan(lineHeight, maximumFontSize);
    absoluteSizeSpan.updateDrawState(tp);
    int newBaselineShift =
        (int)
            -(lineHeight / 2
                - maximumFontSize / 2
                + maximumFontSize
                - fontSize
                + tp.getFontMetrics().top
                - tp.ascent());
    assertThat(tp.baselineShift).isEqualTo(newBaselineShift);
  }

  // text larger font size then other text in the span aligned bottom
  @Test
  public void textWithLargerFontSizeAlignsAtTheBottomOfTheLineHeight() {
    int fontSize = 20;
    int lineHeight = 20;
    int maximumFontSize = 20;
    ReactAbsoluteSizeSpan absoluteSizeSpan = new ReactAbsoluteSizeSpan(fontSize, "bottom-child");
    absoluteSizeSpan.updateSpan(lineHeight, maximumFontSize);
    absoluteSizeSpan.updateDrawState(tp);
    int newBaselineShift = (int) (lineHeight / 2 - fontSize / 2 - tp.descent());
    assertThat(tp.baselineShift).isEqualTo(newBaselineShift);
  }

  @Test
  public void textWithNoLineHeightAlignsBasedOnFontMetrics() {
    int fontSize = 15;
    int lineHeight = 0;
    int maximumFontSize = 16;
    ReactAbsoluteSizeSpan absoluteSizeSpan = new ReactAbsoluteSizeSpan(fontSize, "top-child");
    absoluteSizeSpan.updateSpan(lineHeight, maximumFontSize);
    absoluteSizeSpan.updateDrawState(tp);
    int newBaselineShift = (int) (tp.getFontMetrics().top - tp.ascent() - tp.descent());
    assertThat(tp.baselineShift).isEqualTo(newBaselineShift);
  }
}
