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

import android.content.res.AssetManager;
import android.graphics.Paint;
import android.text.TextPaint;
import com.facebook.react.views.text.CustomStyleSpan.TextAlignVertical;
import org.junit.Before;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.robolectric.RobolectricTestRunner;

@RunWith(RobolectricTestRunner.class)
@PrepareForTest({CustomStyleSpan.class})
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "androidx.*", "android.*"})
public class CustomStyleSpanTest {
  @Rule public PowerMockRule rule = new PowerMockRule();
  TextPaint tp = mock(TextPaint.class);
  Paint.FontMetrics fontMetrics = mock(Paint.FontMetrics.class);
  AssetManager assetManager = mock(AssetManager.class);
  private int mFontSize;

  @Before
  public void setUp() throws Exception {
    // https://stackoverflow.com/a/27631737/7295772
    // top      -------------  -10
    // ascent   -------------  -5
    // baseline __my Text____   0
    // descent  _____________   2
    // bottom   _____________   5
    tp.baselineShift = 0;
    fontMetrics.top = -10.0f;
    fontMetrics.ascent = -5.0f;
    fontMetrics.descent = 2.0f;
    fontMetrics.bottom = 5.0f;
    when(tp.getFontMetrics()).thenReturn(fontMetrics);
    when(tp.ascent()).thenReturn(fontMetrics.ascent);
    when(tp.descent()).thenReturn(fontMetrics.descent);
    PowerMockito.whenNew(TextPaint.class).withNoArguments().thenReturn(tp);
  }

  private CustomStyleSpan createNewSpan(int fontSize, TextAlignVertical textAlignVertical) {
    int fontStyle = 0;
    int fontWeight = 0;
    PowerMockito.when(tp.getTextSize()).thenReturn((float) fontSize);
    return new CustomStyleSpan(
        fontStyle, fontWeight, null, null, assetManager, textAlignVertical, fontSize);
  }

  // span with no text align vertical or text align vertical center
  @Test
  public void shouldNotChangeBaseline() {
    CustomStyleSpan customStyleSpan = createNewSpan(15, TextAlignVertical.CENTER);
    customStyleSpan.updateDrawState(tp);
    // uses the default alignment (baseline)
    assertThat(tp.baselineShift).isEqualTo(0);
  }

  // span has a smaller font then others, textAlignVertical top, line height 10
  @Test
  public void textWithSmallerFontSizeAlignsAtTheTopOfTheLineHeight() {
    int fontSize = 15;
    int lineHeight = 10;
    int maximumFontSize = 16;
    CustomStyleSpan customStyleSpan = createNewSpan(fontSize, TextAlignVertical.TOP);
    customStyleSpan.updateSpan(lineHeight, maximumFontSize);
    customStyleSpan.updateDrawState(tp);
    // aligns correctly text that has smaller font
    int newBaselineShift =
        (int)
            -(lineHeight / 2
                - maximumFontSize / 2
                // smaller font aligns on the baseline of bigger font
                // move the baseline of text with smaller font up
                // so it aligns on the top of the larger font
                + maximumFontSize
                - fontSize
                + tp.getFontMetrics().top
                - tp.ascent());
    assertThat(tp.baselineShift).isEqualTo(newBaselineShift);
  }

  // span has a larger font then others, textAlignVertical bottom, line height 20
  @Test
  public void textWithLargerFontSizeAlignsAtTheBottomOfTheLineHeight() {
    int fontSize = 20;
    int lineHeight = 20;
    int maximumFontSize = 20;
    CustomStyleSpan customStyleSpan = createNewSpan(fontSize, TextAlignVertical.BOTTOM);
    customStyleSpan.updateSpan(lineHeight, maximumFontSize);
    customStyleSpan.updateDrawState(tp);
    // aligns text vertically in the lineHeight
    // and adjust their position depending on the fontSize
    int newBaselineShift = (int) (lineHeight / 2 - fontSize / 2 - tp.descent());
    assertThat(tp.baselineShift).isEqualTo(newBaselineShift);
  }

  // no specified lineHeight prop, textAlignVertical top and fontSize 15
  // https://stackoverflow.com/a/27631737/7295772
  // top      -------------  -10
  // ascent   -------------  -5
  // baseline __my Text____   0
  // descent  _____________   2
  // bottom   _____________   5
  @Test
  public void textWithNoLineHeightAlignsBasedOnFontMetrics() {
    int lineHeight = 0;
    int maximumFontSize = 15;
    CustomStyleSpan customStyleSpan = createNewSpan(15, TextAlignVertical.TOP);
    customStyleSpan.updateSpan(lineHeight, maximumFontSize);
    customStyleSpan.updateDrawState(tp);
    // aligns to the top based on the FontMetrics
    int newBaselineShift = (int) (tp.getFontMetrics().top - tp.ascent() - tp.descent());
    assertThat(tp.baselineShift).isEqualTo(newBaselineShift);
  }
}
