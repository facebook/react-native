/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text;

import static org.fest.assertions.api.Assertions.assertThat;

import android.graphics.Paint;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.robolectric.RobolectricTestRunner;

@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "androidx.*", "android.*"})
public class CustomLineHeightSpanTest {

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
    assertThat(fm.descent).isEqualTo(11);
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
