package com.facebook.react.views.text;

import android.graphics.Paint;

import static org.fest.assertions.api.Assertions.assertThat;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.robolectric.RobolectricTestRunner;

@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "android.*"})
public class CustomLineHeightSpanTest {

  @Test
  public void shouldIncreaseAllMetricsProportionally() {
    CustomLineHeightSpan customLineHeightSpan = new CustomLineHeightSpan(22);
    Paint.FontMetricsInt fm = new Paint.FontMetricsInt();
    fm.top = -10;
    fm.ascent = -5;
    fm.descent = 5;
    fm.bottom = 10;
    customLineHeightSpan.chooseHeight("Hi", 0, 2, 0, 0, fm);
    assertThat(fm.top).isEqualTo(-11);
    assertThat(fm.ascent).isEqualTo(-6);
    assertThat(fm.descent).isEqualTo(6);
    assertThat(fm.bottom).isEqualTo(11);
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
