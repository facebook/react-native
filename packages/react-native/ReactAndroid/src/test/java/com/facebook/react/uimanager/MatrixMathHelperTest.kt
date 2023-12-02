/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import com.facebook.react.uimanager.MatrixMathHelper.MatrixDecompositionContext
import kotlin.math.cos
import kotlin.math.sin
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

/** Test for [MatrixMathHelper] */
@RunWith(RobolectricTestRunner::class)
class MatrixMathHelperTest {

  @Test
  fun testDecomposing4x4MatrixToProduceAccurateZaxisAngles() {
    val ctx = MatrixDecompositionContext()

    MatrixMathHelper.decomposeMatrix(
        doubleArrayOf(
            1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0),
        ctx)

    assertThat(ctx.rotationDegrees).containsSequence(0.0, 0.0, 0.0)

    val angles = doubleArrayOf(30.0, 45.0, 60.0, 75.0, 90.0, 100.0, 115.0, 120.0, 133.0, 167.0)
    for (angle in angles) {
      verifyZRotatedMatrix(angle, 0.0, 0.0, angle)
      verifyZRotatedMatrix(-angle, 0.0, 0.0, -angle)
    }

    verifyZRotatedMatrix(180.0, 0.0, 0.0, 180.0)

    // all values are between 0 and 180;
    // change of sign and direction in the third and fourth quadrant
    verifyZRotatedMatrix(222.0, 0.0, 0.0, -138.0)

    verifyZRotatedMatrix(270.0, 0.0, 0.0, -90.0)

    // 360 is expressed as 0
    verifyZRotatedMatrix(360.0, 0.0, 0.0, 0.0)

    verifyZRotatedMatrix(33.33333333, 0.0, 0.0, 33.333)

    verifyZRotatedMatrix(86.75309, 0.0, 0.0, 86.753)

    verifyZRotatedMatrix(42.00000000001, 0.0, 0.0, 42.0)

    verifyZRotatedMatrix(42.99999999999, 0.0, 0.0, 43.0)

    verifyZRotatedMatrix(42.99999999999, 0.0, 0.0, 43.0)

    verifyZRotatedMatrix(42.49999999999, 0.0, 0.0, 42.5)

    verifyZRotatedMatrix(42.55555555555, 0.0, 0.0, 42.556)
  }

  @Test
  fun testDecomposing4x4MatrixToProduceAccurateYaxisAngles() {
    val angles = doubleArrayOf(30.0, 45.0, 60.0, 75.0, 90.0)
    for (angle in angles) {
      verifyYRotatedMatrix(angle, 0.0, angle, 0.0)
      verifyYRotatedMatrix(-angle, 0.0, -angle, 0.0)
    }

    // all values are between -90 and 90;
    // change of sign and direction in the third and fourth quadrant
    verifyYRotatedMatrix(222.0, -180.0, -42.0, -180.0)

    verifyYRotatedMatrix(270.0, -180.0, -90.0, -180.0)

    verifyYRotatedMatrix(360.0, 0.0, 0.0, 0.0)
  }

  @Test
  fun testDecomposing4x4MatrixToProduceAccurateXaxisAngles() {
    val angles = doubleArrayOf(30.0, 45.0, 60.0, 75.0, 90.0, 100.0, 110.0, 120.0, 133.0, 167.0)
    for (angle in angles) {
      verifyXRotatedMatrix(angle, angle, 0.0, 0.0)
      verifyXRotatedMatrix(-angle, -angle, 0.0, 0.0)
    }

    // all values are between 0 and 180;
    // change of sign and direction in the third and fourth quadrant
    verifyXRotatedMatrix(222.0, -138.0, 0.0, 0.0)

    verifyXRotatedMatrix(270.0, -90.0, 0.0, 0.0)

    verifyXRotatedMatrix(360.0, 0.0, 0.0, 0.0)
  }

  @Test
  fun testDecomposingComplex4x4MatrixToProduceAccurateAngles() {
    verifyRotatedMatrix(10.0, -80.0, 0.0, 10.0, -80.0, 0.0)
    // x and y will flip
    verifyRotatedMatrix(10.0, -95.0, 0.0, -170.0, -85.0, -180.0)
  }

  private fun verifyZRotatedMatrix(degrees: Double, rotX: Double, rotY: Double, rotZ: Double) {
    val ctx = MatrixDecompositionContext()
    val matrix = createRotateZ(degreesToRadians(degrees))

    MatrixMathHelper.decomposeMatrix(matrix, ctx)

    assertThat(ctx.rotationDegrees).containsSequence(rotX, rotY, rotZ)
  }

  private fun verifyYRotatedMatrix(degrees: Double, rotX: Double, rotY: Double, rotZ: Double) {
    val ctx = MatrixDecompositionContext()
    val matrix = createRotateY(degreesToRadians(degrees))

    MatrixMathHelper.decomposeMatrix(matrix, ctx)

    assertThat(ctx.rotationDegrees).containsSequence(rotX, rotY, rotZ)
  }

  private fun verifyXRotatedMatrix(degrees: Double, rotX: Double, rotY: Double, rotZ: Double) {
    val ctx = MatrixDecompositionContext()
    val matrix = createRotateX(degreesToRadians(degrees))

    MatrixMathHelper.decomposeMatrix(matrix, ctx)

    assertThat(ctx.rotationDegrees).containsSequence(rotX, rotY, rotZ)
  }

  private fun verifyRotatedMatrix(
      degreesX: Double,
      degreesY: Double,
      degreesZ: Double,
      rotX: Double,
      rotY: Double,
      rotZ: Double
  ) {
    val ctx = MatrixDecompositionContext()
    val matrixX = createRotateX(degreesToRadians(degreesX))
    val matrixY = createRotateY(degreesToRadians(degreesY))
    val matrixZ = createRotateZ(degreesToRadians(degreesZ))
    val matrix = MatrixMathHelper.createIdentityMatrix()

    MatrixMathHelper.multiplyInto(matrix, matrix, matrixX)
    MatrixMathHelper.multiplyInto(matrix, matrix, matrixY)
    MatrixMathHelper.multiplyInto(matrix, matrix, matrixZ)
    MatrixMathHelper.decomposeMatrix(matrix, ctx)

    assertThat(ctx.rotationDegrees).containsSequence(rotX, rotY, rotZ)
  }

  companion object {
    private fun degreesToRadians(degrees: Double): Double {
      return degrees * Math.PI / 180
    }

    private fun createRotateZ(radians: Double): DoubleArray {
      val mat = MatrixMathHelper.createIdentityMatrix()
      mat[0] = cos(radians)
      mat[1] = sin(radians)
      mat[4] = -sin(radians)
      mat[5] = cos(radians)

      return mat
    }

    private fun createRotateY(radians: Double): DoubleArray {
      val mat = MatrixMathHelper.createIdentityMatrix()
      mat[0] = cos(radians)
      mat[2] = -sin(radians)
      mat[8] = sin(radians)
      mat[10] = cos(radians)

      return mat
    }

    private fun createRotateX(radians: Double): DoubleArray {
      val mat = MatrixMathHelper.createIdentityMatrix()
      mat[5] = cos(radians)
      mat[6] = sin(radians)
      mat[9] = -sin(radians)
      mat[10] = cos(radians)

      return mat
    }
  }
}
