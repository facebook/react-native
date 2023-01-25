/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import static org.assertj.core.api.Assertions.assertThat;

import android.text.SpannableString;
import android.text.Spanned;
import android.text.TextPaint;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.robolectric.RobolectricTestRunner;

@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "androidx.*", "android.*"})
public class ReactAbsoluteSizeSpanTest {
  private class MockAbsoluteSpan extends ReactAbsoluteSizeSpan {
    private TextPaint mTextPaint;

    public MockAbsoluteSpan(int size) {
      super(size);
    }

    public MockAbsoluteSpan(int size, String textAlignVertical) {
      super(size, textAlignVertical);
    }

    @Override
    public void updateDrawState(TextPaint ds) {
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
    final SpannableString text = new SpannableString("P.");
    MockAbsoluteSpan mockAbsoluteSpan = new MockAbsoluteSpan(15, "top-child");
    text.setSpan(mockAbsoluteSpan, 0, 1, Spanned.SPAN_INCLUSIVE_INCLUSIVE);
    assertThat(mockAbsoluteSpan.getTextPaint().getFontMetrics().top).isEqualTo(99);
  }
}
