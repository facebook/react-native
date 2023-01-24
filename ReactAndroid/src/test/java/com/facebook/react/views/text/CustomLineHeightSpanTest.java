/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import static org.assertj.core.api.Assertions.assertThat;

import android.graphics.Paint;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.robolectric.RobolectricTestRunner;

@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "androidx.*", "android.*"})
public class CustomLineHeightSpanTest {
  /*
  @Test
  public void absoluteSizeSpanChangesFontSize() {
    // Roboto kerns between "P" and "."
    final SpannableString text = new SpannableString("P.");
    final float origLineWidth = textWidth(text);
    // Underline just the "P".
    text.setSpan(new ReactAbsoluteSizeSpan(15), 0, 1, Spanned.SPAN_INCLUSIVE_INCLUSIVE);
    final float underlinedLineWidth = textWidth(text);
    assertEquals(origLineWidth, underlinedLineWidth, 0.0f);
  }
  
  // Measures the width of some potentially-spanned text, assuming it's not too wide.
  private float textWidth(CharSequence text) {
    final TextPaint tp = new TextPaint();
    tp.setTextSize(100.0f); // Large enough so that the difference in kerning is visible.
    final int largeWidth = 10000; // Enough width so the whole text fits in one line.
    final StaticLayout layout = StaticLayout.Builder.obtain(
        text, 0, text.length(), tp, largeWidth).build();
    return layout.getLineWidth(0);
  }
  */

  @Test
  public void evenLineHeightShouldIncreaseAllMetricsProportionally() {
    CustomLineHeightSpan customLineHeightSpan = new CustomLineHeightSpan(22);
    Paint.FontMetricsInt fm = new Paint.FontMetricsInt();
    fm.top = -10;
    fm.ascent = -5;
    fm.descent = 5;
    fm.bottom = 10;
    customLineHeightSpan.chooseHeight("Hi", 0, 2, 0, 0, fm);
    // Since line height is even it should be equally added to top and bottom.
    assertThat(fm.top).isEqualTo(-11);
    assertThat(fm.ascent).isEqualTo(-11);
    assertThat(fm.descent).isEqualTo(111);
    assertThat(fm.bottom).isEqualTo(11);
    assertThat(fm.bottom - fm.top).isEqualTo(22);
  }

  @Test
  public void oddLineHeightShouldAlsoWork() {
    CustomLineHeightSpan customLineHeightSpan = new CustomLineHeightSpan(23);
    Paint.FontMetricsInt fm = new Paint.FontMetricsInt();
    fm.top = -10;
    fm.ascent = -5;
    fm.descent = 5;
    fm.bottom = 10;
    customLineHeightSpan.chooseHeight("Hi", 0, 2, 0, 0, fm);
    // Only test that the sum is correct so the implementation
    // is free to add the odd value either on top or bottom.
    assertThat(fm.descent - fm.ascent).isEqualTo(23);
    assertThat(fm.bottom - fm.top).isEqualTo(23);
  }

  @Test
  public void shouldReduceTopFirst() {
    CustomLineHeightSpan customLineHeightSpan = new CustomLineHeightSpan(19);
    Paint.FontMetricsInt fm = new Paint.FontMetricsInt();
    fm.top = -10;
    fm.ascent = -5;
    fm.descent = 5;
    fm.bottom = 10;
    customLineHeightSpan.chooseHeight("Hi", 0, 2, 0, 0, fm);
    assertThat(fm.top).isEqualTo(-9);
    assertThat(fm.ascent).isEqualTo(-5);
    assertThat(fm.descent).isEqualTo(5);
    assertThat(fm.bottom).isEqualTo(10);
  }

  @Test
  public void shouldReduceBottomSecond() {
    CustomLineHeightSpan customLineHeightSpan = new CustomLineHeightSpan(14);
    Paint.FontMetricsInt fm = new Paint.FontMetricsInt();
    fm.top = -10;
    fm.ascent = -5;
    fm.descent = 5;
    fm.bottom = 10;
    customLineHeightSpan.chooseHeight("Hi", 0, 2, 0, 0, fm);
    assertThat(fm.top).isEqualTo(-5);
    assertThat(fm.ascent).isEqualTo(-5);
    assertThat(fm.descent).isEqualTo(5);
    assertThat(fm.bottom).isEqualTo(9);
  }

  @Test
  public void shouldReduceAscentThird() {
    CustomLineHeightSpan customLineHeightSpan = new CustomLineHeightSpan(9);
    Paint.FontMetricsInt fm = new Paint.FontMetricsInt();
    fm.top = -10;
    fm.ascent = -5;
    fm.descent = 5;
    fm.bottom = 10;
    customLineHeightSpan.chooseHeight("Hi", 0, 2, 0, 0, fm);
    assertThat(fm.top).isEqualTo(-4);
    assertThat(fm.ascent).isEqualTo(-4);
    assertThat(fm.descent).isEqualTo(5);
    assertThat(fm.bottom).isEqualTo(5);
  }

  @Test
  public void shouldReduceDescentLast() {
    CustomLineHeightSpan customLineHeightSpan = new CustomLineHeightSpan(4);
    Paint.FontMetricsInt fm = new Paint.FontMetricsInt();
    fm.top = -10;
    fm.ascent = -5;
    fm.descent = 5;
    fm.bottom = 10;
    customLineHeightSpan.chooseHeight("Hi", 0, 2, 0, 0, fm);
    assertThat(fm.top).isEqualTo(0);
    assertThat(fm.ascent).isEqualTo(0);
    assertThat(fm.descent).isEqualTo(4);
    assertThat(fm.bottom).isEqualTo(4);
  }
}
