package com.facebook.react.animated;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;

import static org.fest.assertions.api.Assertions.assertThat;

/**
 * Tests method used by {@link InterpolationAnimatedNode} to interpolate value of the input nodes.
 */
@RunWith(RobolectricTestRunner.class)
public class NativeAnimatedInterpolationTest {

  @Test
  public void testSimpleOneToOneMapping() {
    double[] input = new double[] {0d, 1d};
    double[] output = new double[] {0d, 1d};
    assertThat(InterpolationAnimatedNode.interpolate(0, input, output)).isEqualTo(0);
    assertThat(InterpolationAnimatedNode.interpolate(0.5, input, output)).isEqualTo(0.5);
    assertThat(InterpolationAnimatedNode.interpolate(0.8, input, output)).isEqualTo(0.8);
    assertThat(InterpolationAnimatedNode.interpolate(1, input, output)).isEqualTo(1);
  }

  @Test
  public void testWiderOutputRange() {
    double[] input = new double[] {0d, 1d};
    double[] output = new double[] {100d, 200d};
    assertThat(InterpolationAnimatedNode.interpolate(0, input, output)).isEqualTo(100);
    assertThat(InterpolationAnimatedNode.interpolate(0.5, input, output)).isEqualTo(150);
    assertThat(InterpolationAnimatedNode.interpolate(0.8, input, output)).isEqualTo(180);
    assertThat(InterpolationAnimatedNode.interpolate(1, input, output)).isEqualTo(200);
  }

  @Test
  public void testWiderInputRange() {
    double[] input = new double[] {2000d, 3000d};
    double[] output = new double[] {1d, 2d};
    assertThat(InterpolationAnimatedNode.interpolate(2000, input, output)).isEqualTo(1);
    assertThat(InterpolationAnimatedNode.interpolate(2250, input, output)).isEqualTo(1.25);
    assertThat(InterpolationAnimatedNode.interpolate(2800, input, output)).isEqualTo(1.8);
    assertThat(InterpolationAnimatedNode.interpolate(3000, input, output)).isEqualTo(2);
  }

  @Test
  public void testManySegments() {
    double[] input = new double[] {-1d, 1d, 5d};
    double[] output = new double[] {0, 10d, 20d};
    assertThat(InterpolationAnimatedNode.interpolate(-1, input, output)).isEqualTo(0);
    assertThat(InterpolationAnimatedNode.interpolate(0, input, output)).isEqualTo(5);
    assertThat(InterpolationAnimatedNode.interpolate(1, input, output)).isEqualTo(10);
    assertThat(InterpolationAnimatedNode.interpolate(2, input, output)).isEqualTo(12.5);
    assertThat(InterpolationAnimatedNode.interpolate(5, input, output)).isEqualTo(20);
  }

  @Test
  public void testExtrapolate() {
    double[] input = new double[] {10d, 20d};
    double[] output = new double[] {0d, 1d};
    assertThat(InterpolationAnimatedNode.interpolate(30d, input, output)).isEqualTo(2);
    assertThat(InterpolationAnimatedNode.interpolate(5d, input, output)).isEqualTo(-0.5);
  }

}
