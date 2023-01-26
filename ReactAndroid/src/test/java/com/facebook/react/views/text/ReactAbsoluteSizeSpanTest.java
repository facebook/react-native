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
import android.util.Log;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.robolectric.RobolectricTestRunner;

@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "androidx.*", "android.*"})
public class ReactAbsoluteSizeSpanTest {
  private class MockedTextPaint extends TextPaint {
    private static final String TAG = "MockTextPaint";

    /**
     * Allocates a new FontMetrics object, and then calls getFontMetrics(fm) with it, returning the
     * object.
     */
    @Override
    public FontMetrics getFontMetrics() {
      String methodName = "getFontMetrics";
      MockedTextPaint.FontMetrics fm = new MockedTextPaint.FontMetrics();
      Log.w(
          "ReactTest:: MockedTextPaint" + TAG,
          methodName
              + " fm.top: "
              + (fm.top)
              + " fm.ascent: "
              + (fm.ascent)
              + " fm.bottom: "
              + (fm.bottom)
              + " fm.top: "
              + (fm.top));
      return fm;
    }

    public class FontMetrics extends Paint.FontMetrics {
      /**
       * The maximum distance above the baseline for the tallest glyph in the font at a given text
       * size.
       */
      public float top = -15;
      /** The recommended distance above the baseline for singled spaced text. */
      public float ascent = -10;
      /** The recommended distance below the baseline for singled spaced text. */
      public float descent = 10;
      /**
       * The maximum distance below the baseline for the lowest glyph in the font at a given text
       * size.
       */
      public float bottom = 15;
      /** The recommended additional space to add between lines of text. */
      public float leading = 0;
    }
  }

  private class MockedAbsoluteSpan extends ReactAbsoluteSizeSpan {
    private TextPaint mTextPaint;

    public MockedAbsoluteSpan(int size) {
      super(size);
    }

    public MockedAbsoluteSpan(int size, String textAlignVertical) {
      super(size, textAlignVertical);
    }

    public void updateDrawState(MockedTextPaint ds) {
      super.updateDrawState(ds);
      mTextPaint = ds;
    }

    public TextPaint getTextPaint() {
      return mTextPaint;
    }
  }

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
    String methodName = "textWithNoLineHeightAlignsBasedOnFontMetrics";
    TextPaint tp = mock(TextPaint.class);
    Paint.FontMetrics fontMetrics = mock(Paint.FontMetrics.class);
    fontMetrics.top = 2.0f;
    fontMetrics.bottom = 3.0f;
    when(tp.getFontMetrics()).thenReturn(fontMetrics);
    when(tp.ascent()).thenReturn(4.0f);
    when(tp.descent()).thenReturn(5.0f);
    int fontSize = 15;
    ReactAbsoluteSizeSpan absoluteSizeSpan = new ReactAbsoluteSizeSpan(fontSize, "top-child");
    Log.w(
        "ReactTest::",
        methodName
            + " tp.getFontMetrics().top: "
            + (tp.getFontMetrics().top)
            + " tp.getFontMetrics().bottom: "
            + (tp.getFontMetrics().bottom));
    int lineHeight = 0;
    int maximumFontSize = 16;
    absoluteSizeSpan.updateSpan(lineHeight, maximumFontSize);
    absoluteSizeSpan.updateDrawState(tp);
    assertThat(tp.getFontMetrics().top).isEqualTo(99);
  }
}
