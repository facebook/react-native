/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.graphics.Paint
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class CustomLineHeightSpanTest {

  @Test
  fun evenLineHeightShouldIncreaseAllMetricsProportionally() {
    val customLineHeightSpan = CustomLineHeightSpan(22f)
    val fm =
        Paint.FontMetricsInt().apply {
          top = -10
          ascent = -5
          descent = 5
          bottom = 10
        }
    customLineHeightSpan.chooseHeight("Hi", 0, 2, 0, 0, fm)
    assertThat(fm.top).isEqualTo(-11)
    assertThat(fm.ascent).isEqualTo(-11)
    assertThat(fm.descent).isEqualTo(11)
    assertThat(fm.bottom).isEqualTo(11)
    assertThat(fm.bottom - fm.top).isEqualTo(22)
  }

  @Test
  fun oddLineHeightShouldAlsoWork() {
    val customLineHeightSpan = CustomLineHeightSpan(23f)
    val fm =
        Paint.FontMetricsInt().apply {
          top = -10
          ascent = -5
          descent = 5
          bottom = 10
        }
    customLineHeightSpan.chooseHeight("Hi", 0, 2, 0, 0, fm)
    assertThat(fm.descent - fm.ascent).isEqualTo(23)
    assertThat(fm.bottom - fm.top).isEqualTo(23)
  }

  @Test
  fun shouldReduceTopFirst() {
    val customLineHeightSpan = CustomLineHeightSpan(19f)
    val fm =
        Paint.FontMetricsInt().apply {
          top = -10
          ascent = -5
          descent = 5
          bottom = 10
        }
    customLineHeightSpan.chooseHeight("Hi", 0, 2, 0, 0, fm)
    assertThat(fm.top).isEqualTo(-9)
    assertThat(fm.ascent).isEqualTo(-5)
    assertThat(fm.descent).isEqualTo(5)
    assertThat(fm.bottom).isEqualTo(10)
  }

  @Test
  fun shouldReduceBottomSecond() {
    val customLineHeightSpan = CustomLineHeightSpan(14f)
    val fm =
        Paint.FontMetricsInt().apply {
          top = -10
          ascent = -5
          descent = 5
          bottom = 10
        }
    customLineHeightSpan.chooseHeight("Hi", 0, 2, 0, 0, fm)
    assertThat(fm.top).isEqualTo(-5)
    assertThat(fm.ascent).isEqualTo(-5)
    assertThat(fm.descent).isEqualTo(5)
    assertThat(fm.bottom).isEqualTo(9)
  }

  @Test
  fun shouldReduceAscentThird() {
    val customLineHeightSpan = CustomLineHeightSpan(9f)
    val fm =
        Paint.FontMetricsInt().apply {
          top = -10
          ascent = -5
          descent = 5
          bottom = 10
        }
    customLineHeightSpan.chooseHeight("Hi", 0, 2, 0, 0, fm)
    assertThat(fm.top).isEqualTo(-4)
    assertThat(fm.ascent).isEqualTo(-4)
    assertThat(fm.descent).isEqualTo(5)
    assertThat(fm.bottom).isEqualTo(5)
  }

  @Test
  fun shouldReduceDescentLast() {
    val customLineHeightSpan = CustomLineHeightSpan(4f)
    val fm =
        Paint.FontMetricsInt().apply {
          top = -10
          ascent = -5
          descent = 5
          bottom = 10
        }
    customLineHeightSpan.chooseHeight("Hi", 0, 2, 0, 0, fm)
    assertThat(fm.top).isEqualTo(0)
    assertThat(fm.ascent).isEqualTo(0)
    assertThat(fm.descent).isEqualTo(4)
    assertThat(fm.bottom).isEqualTo(4)
  }
}
