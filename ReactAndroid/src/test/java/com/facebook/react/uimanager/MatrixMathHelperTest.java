/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;

import static org.fest.assertions.api.Assertions.assertThat;

/**
 * Test for {@link MatrixMathHelper}
 */
@RunWith(RobolectricTestRunner.class)
public class MatrixMathHelperTest {

  private void verifyZRotatedMatrix(double degrees, double rotX, double rotY, double rotZ) {
    MatrixMathHelper.MatrixDecompositionContext ctx =
      new MatrixMathHelper.MatrixDecompositionContext();
    double[] matrix = createRotateZ(degreesToRadians(degrees));
    MatrixMathHelper.decomposeMatrix(matrix, ctx);
    assertThat(ctx.rotationDegrees).containsSequence(rotX, rotY, rotZ);
  }

  private void verifyYRotatedMatrix(double degrees, double rotX, double rotY, double rotZ) {
    MatrixMathHelper.MatrixDecompositionContext ctx =
      new MatrixMathHelper.MatrixDecompositionContext();
    double[] matrix = createRotateY(degreesToRadians(degrees));
    MatrixMathHelper.decomposeMatrix(matrix, ctx);
    assertThat(ctx.rotationDegrees).containsSequence(rotX, rotY, rotZ);
  }

  private void verifyXRotatedMatrix(double degrees, double rotX, double rotY, double rotZ) {
    MatrixMathHelper.MatrixDecompositionContext ctx =
      new MatrixMathHelper.MatrixDecompositionContext();
    double[] matrix = createRotateX(degreesToRadians(degrees));
    MatrixMathHelper.decomposeMatrix(matrix, ctx);
    assertThat(ctx.rotationDegrees).containsSequence(rotX, rotY, rotZ);
  }

  private void verifyRotatedMatrix(double degreesX, double degreesY, double degreesZ, double rotX, double rotY, double rotZ) {
    MatrixMathHelper.MatrixDecompositionContext ctx =
      new MatrixMathHelper.MatrixDecompositionContext();
    double[] matrixX = createRotateX(degreesToRadians(degreesX));
    double[] matrixY = createRotateY(degreesToRadians(degreesY));
    double[] matrixZ = createRotateZ(degreesToRadians(degreesZ));
    double[] matrix = MatrixMathHelper.createIdentityMatrix();
    MatrixMathHelper.multiplyInto(matrix, matrix, matrixX);
    MatrixMathHelper.multiplyInto(matrix, matrix, matrixY);
    MatrixMathHelper.multiplyInto(matrix, matrix, matrixZ);
    MatrixMathHelper.decomposeMatrix(matrix, ctx);
    assertThat(ctx.rotationDegrees).containsSequence(rotX, rotY, rotZ);
  }

  @Test
  public void testDecomposing4x4MatrixToProduceAccurateZaxisAngles() {

    MatrixMathHelper.MatrixDecompositionContext ctx =
      new MatrixMathHelper.MatrixDecompositionContext();

    MatrixMathHelper.decomposeMatrix(
      new double[]{1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1},
      ctx);

    assertThat(ctx.rotationDegrees).containsSequence(0d, 0d, 0d);

    double[] angles = new double[]{30, 45, 60, 75, 90, 100, 115, 120, 133, 167};
    for (double angle : angles) {
      verifyZRotatedMatrix(angle, 0d, 0d, angle);
      verifyZRotatedMatrix(-angle, 0d, 0d, -angle);
    }

    verifyZRotatedMatrix(180d, 0d, 0d, 180d);

    // all values are between 0 and 180;
    // change of sign and direction in the third and fourth quadrant
    verifyZRotatedMatrix(222, 0d, 0d, -138d);

    verifyZRotatedMatrix(270, 0d, 0d, -90d);

    // 360 is expressed as 0
    verifyZRotatedMatrix(360, 0d, 0d, 0d);

    verifyZRotatedMatrix(33.33333333, 0d, 0d, 33.333d);

    verifyZRotatedMatrix(86.75309, 0d, 0d, 86.753d);

    verifyZRotatedMatrix(42.00000000001, 0d, 0d, 42d);

    verifyZRotatedMatrix(42.99999999999, 0d, 0d, 43d);

    verifyZRotatedMatrix(42.99999999999, 0d, 0d, 43d);

    verifyZRotatedMatrix(42.49999999999, 0d, 0d, 42.5d);

    verifyZRotatedMatrix(42.55555555555, 0d, 0d, 42.556d);
  }

  @Test
  public void testDecomposing4x4MatrixToProduceAccurateYaxisAngles() {
    double[] angles = new double[]{30, 45, 60, 75, 90};
    for (double angle : angles) {
      verifyYRotatedMatrix(angle, 0d, angle, 0d);
      verifyYRotatedMatrix(-angle, 0d, -angle, 0d);
    }

    // all values are between -90 and 90;
    // change of sign and direction in the third and fourth quadrant
    verifyYRotatedMatrix(222, -180d, -42d, -180d);

    verifyYRotatedMatrix(270, -180d, -90d, -180d);

    verifyYRotatedMatrix(360, 0d, 0d, 0d);
  }

  @Test
  public void testDecomposing4x4MatrixToProduceAccurateXaxisAngles() {
    double[] angles = new double[]{30, 45, 60, 75, 90, 100, 110, 120, 133, 167};
    for (double angle : angles) {
      verifyXRotatedMatrix(angle, angle, 0d, 0d);
      verifyXRotatedMatrix(-angle, -angle, 0d, 0d);
    }

    // all values are between 0 and 180;
    // change of sign and direction in the third and fourth quadrant
    verifyXRotatedMatrix(222, -138d, 0d, 0d);

    verifyXRotatedMatrix(270, -90d, 0d, 0d);

    verifyXRotatedMatrix(360, 0d, 0d, 0d);
  }

  @Test
  public void testDecomposingComplex4x4MatrixToProduceAccurateAngles() {
    verifyRotatedMatrix(10, -80, 0, 10, -80, 0);
    // x and y will flip
    verifyRotatedMatrix(10, -95, 0, -170, -85, -180);
  }

  private static double degreesToRadians(double degrees) {
    return degrees * Math.PI / 180;
  }

  private static double[] createRotateZ(double radians) {
    double[] mat = MatrixMathHelper.createIdentityMatrix();
    mat[0] = Math.cos(radians);
    mat[1] = Math.sin(radians);
    mat[4] = -Math.sin(radians);
    mat[5] = Math.cos(radians);
    return mat;
  }

  private static double[] createRotateY(double radians) {
    double[] mat = MatrixMathHelper.createIdentityMatrix();
    mat[0] = Math.cos(radians);
    mat[2] = -Math.sin(radians);
    mat[8] = Math.sin(radians);
    mat[10] = Math.cos(radians);
    return mat;
  }

  private static double[] createRotateX(double radians) {
    double[] mat = MatrixMathHelper.createIdentityMatrix();
    mat[5] = Math.cos(radians);
    mat[6] = Math.sin(radians);
    mat[9] = -Math.sin(radians);
    mat[10] = Math.cos(radians);
    return mat;
  }
}
