/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated;

import static org.fest.assertions.api.Assertions.assertThat;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;

/**
 * Tests method used by {@link InterpolationAnimatedNode} to interpolate value of the input nodes.
 */
@RunWith(RobolectricTestRunner.class)
public class NativeAnimatedInterpolationTest {

  private double simpleInterpolation(double value, double[] input, double[] output) {
    return InterpolationAnimatedNode.interpolate(
        value,
        input,
        output,
        InterpolationAnimatedNode.EXTRAPOLATE_TYPE_EXTEND,
        InterpolationAnimatedNode.EXTRAPOLATE_TYPE_EXTEND);
  }

  @Test
  public void testSimpleOneToOneMapping() {
    double[] input = new double[] {0d, 1d};
    double[] output = new double[] {0d, 1d};
    assertThat(simpleInterpolation(0, input, output)).isEqualTo(0);
    assertThat(simpleInterpolation(0.5, input, output)).isEqualTo(0.5);
    assertThat(simpleInterpolation(0.8, input, output)).isEqualTo(0.8);
    assertThat(simpleInterpolation(1, input, output)).isEqualTo(1);
  }

  @Test
  public void testWiderOutputRange() {
    double[] input = new double[] {0d, 1d};
    double[] output = new double[] {100d, 200d};
    assertThat(simpleInterpolation(0, input, output)).isEqualTo(100);
    assertThat(simpleInterpolation(0.5, input, output)).isEqualTo(150);
    assertThat(simpleInterpolation(0.8, input, output)).isEqualTo(180);
    assertThat(simpleInterpolation(1, input, output)).isEqualTo(200);
  }

  @Test
  public void testWiderInputRange() {
    double[] input = new double[] {2000d, 3000d};
    double[] output = new double[] {1d, 2d};
    assertThat(simpleInterpolation(2000, input, output)).isEqualTo(1);
    assertThat(simpleInterpolation(2250, input, output)).isEqualTo(1.25);
    assertThat(simpleInterpolation(2800, input, output)).isEqualTo(1.8);
    assertThat(simpleInterpolation(3000, input, output)).isEqualTo(2);
  }

  @Test
  public void testManySegments() {
    double[] input = new double[] {-1d, 1d, 5d};
    double[] output = new double[] {0, 10d, 20d};
    assertThat(simpleInterpolation(-1, input, output)).isEqualTo(0);
    assertThat(simpleInterpolation(0, input, output)).isEqualTo(5);
    assertThat(simpleInterpolation(1, input, output)).isEqualTo(10);
    assertThat(simpleInterpolation(2, input, output)).isEqualTo(12.5);
    assertThat(simpleInterpolation(5, input, output)).isEqualTo(20);
  }

  @Test
  public void testExtendExtrapolate() {
    double[] input = new double[] {10d, 20d};
    double[] output = new double[] {0d, 1d};
    assertThat(simpleInterpolation(30d, input, output)).isEqualTo(2);
    assertThat(simpleInterpolation(5d, input, output)).isEqualTo(-0.5);
  }

  @Test
  public void testClampExtrapolate() {
    double[] input = new double[] {10d, 20d};
    double[] output = new double[] {0d, 1d};
    assertThat(
            InterpolationAnimatedNode.interpolate(
                30d,
                input,
                output,
                InterpolationAnimatedNode.EXTRAPOLATE_TYPE_CLAMP,
                InterpolationAnimatedNode.EXTRAPOLATE_TYPE_CLAMP))
        .isEqualTo(1);
    assertThat(
            InterpolationAnimatedNode.interpolate(
                5d,
                input,
                output,
                InterpolationAnimatedNode.EXTRAPOLATE_TYPE_CLAMP,
                InterpolationAnimatedNode.EXTRAPOLATE_TYPE_CLAMP))
        .isEqualTo(0);
  }

  @Test
  public void testIdentityExtrapolate() {
    double[] input = new double[] {10d, 20d};
    double[] output = new double[] {0d, 1d};
    assertThat(
            InterpolationAnimatedNode.interpolate(
                30d,
                input,
                output,
                InterpolationAnimatedNode.EXTRAPOLATE_TYPE_IDENTITY,
                InterpolationAnimatedNode.EXTRAPOLATE_TYPE_IDENTITY))
        .isEqualTo(30);
    assertThat(
            InterpolationAnimatedNode.interpolate(
                5d,
                input,
                output,
                InterpolationAnimatedNode.EXTRAPOLATE_TYPE_IDENTITY,
                InterpolationAnimatedNode.EXTRAPOLATE_TYPE_IDENTITY))
        .isEqualTo(5);
  }
}
