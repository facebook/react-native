/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowSoLoader::class])
class TransformHelperTest {

  @Test
  fun testTransformHoldingANonFiniteNumberIsIgnored() {
    val operations =
        listOf(
            "perspective",
            "rotate",
            "rotateX",
            "rotateY",
            "rotateZ",
            "scale",
            "scaleX",
            "scaleY",
            "skewX",
            "skewY",
            "translateX",
            "translateY",
        )

    for (nonFiniteNumber in
        doubleArrayOf(Double.NaN, Double.POSITIVE_INFINITY, Double.NEGATIVE_INFINITY)) {
      val matrix = MatrixMathHelper.createIdentityMatrix()
      matrix[0] = nonFiniteNumber
      val transforms =
          operations.map { operation -> JavaOnlyMap.of(operation, nonFiniteNumber) } +
              listOf(
                  JavaOnlyMap.of("translate", JavaOnlyArray.of(nonFiniteNumber, 0.0)),
                  JavaOnlyMap.of("translate", JavaOnlyArray.of(0.0, nonFiniteNumber)),
                  JavaOnlyMap.of("matrix", JavaOnlyArray.of(*matrix.toTypedArray())),
              )

      for (transform in transforms) {
        val result = DoubleArray(16)
        TransformHelper.processTransform(
            JavaOnlyArray.of(JavaOnlyMap.of("translateX", 10.0), transform),
            result,
            100f,
            100f,
            null,
        )

        assertThat(result)
            .describedAs("$transform")
            .containsExactly(*MatrixMathHelper.createIdentityMatrix())
      }
    }
  }

  @Test
  fun testTransformWithAnOperandParsingToANonFiniteNumberIsIgnored() {
    for (transform in
        listOf(
            JavaOnlyMap.of("rotate", "NaNdeg"),
            JavaOnlyMap.of("skewX", "Infinityrad"),
            JavaOnlyMap.of("translateX", "NaN%"),
        )) {
      val result = DoubleArray(16)
      TransformHelper.processTransform(
          JavaOnlyArray.of(JavaOnlyMap.of("translateX", 10.0), transform),
          result,
          100f,
          100f,
          null,
      )

      assertThat(result)
          .describedAs("$transform")
          .containsExactly(*MatrixMathHelper.createIdentityMatrix())
    }
  }

  @Test
  fun testTransformOriginHoldingANonFiniteNumberIsIgnored() {
    val transforms = JavaOnlyArray.of(JavaOnlyMap.of("scaleX", 2.0))
    val expected = DoubleArray(16)
    TransformHelper.processTransform(transforms, expected, 100f, 100f, null)

    for (transformOrigin in
        listOf(
            JavaOnlyArray.of(Double.NaN, 0.0, 0.0),
            JavaOnlyArray.of(0.0, Double.POSITIVE_INFINITY, 0.0),
            JavaOnlyArray.of(0.0, 0.0, Double.NaN),
        )) {
      val result = DoubleArray(16)
      TransformHelper.processTransform(transforms, result, 100f, 100f, transformOrigin)

      assertThat(result).describedAs("$transformOrigin").containsExactly(*expected)
    }
  }

  @Test
  fun testPerspectiveBelowOnePixelRendersAsOnePixel() {
    val result = DoubleArray(16)
    TransformHelper.processTransform(
        JavaOnlyArray.of(JavaOnlyMap.of("perspective", 0.0)),
        result,
        100f,
        100f,
        null,
    )

    assertThat(result[11]).isEqualTo(-1.0)
  }
}
