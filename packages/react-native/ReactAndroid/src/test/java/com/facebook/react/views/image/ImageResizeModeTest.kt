/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.image

import android.graphics.Shader.TileMode
import com.facebook.drawee.drawable.ScalingUtils
import org.assertj.core.api.Assertions
import org.junit.Test

class ImageResizeModeTest {

  @Test
  fun testScaleType() {
    Assertions.assertThat(ImageResizeMode.toScaleType(null))
        .isEqualTo(ScalingUtils.ScaleType.CENTER_CROP)
    Assertions.assertThat(ImageResizeMode.toScaleType("contain"))
        .isEqualTo(ScalingUtils.ScaleType.FIT_CENTER)
    Assertions.assertThat(ImageResizeMode.toScaleType("cover"))
        .isEqualTo(ScalingUtils.ScaleType.CENTER_CROP)
    Assertions.assertThat(ImageResizeMode.toScaleType("stretch"))
        .isEqualTo(ScalingUtils.ScaleType.FIT_XY)
    Assertions.assertThat(ImageResizeMode.toScaleType("center"))
        .isEqualTo(ScalingUtils.ScaleType.CENTER_INSIDE)
    Assertions.assertThat(ImageResizeMode.toScaleType("repeat"))
        .isEqualTo(ScaleTypeStartInside.INSTANCE)
    Assertions.assertThat(ImageResizeMode.toScaleType("none"))
        .isEqualTo(ScaleTypeStartInside.INSTANCE)

    // No resizeMode set
    Assertions.assertThat(ImageResizeMode.defaultValue())
        .isEqualTo(ScalingUtils.ScaleType.CENTER_CROP)
  }

  @Test
  fun testTileMode() {
    Assertions.assertThat(ImageResizeMode.toTileMode(null)).isEqualTo(TileMode.CLAMP)
    Assertions.assertThat(ImageResizeMode.toTileMode("contain")).isEqualTo(TileMode.CLAMP)
    Assertions.assertThat(ImageResizeMode.toTileMode("cover")).isEqualTo(TileMode.CLAMP)
    Assertions.assertThat(ImageResizeMode.toTileMode("stretch")).isEqualTo(TileMode.CLAMP)
    Assertions.assertThat(ImageResizeMode.toTileMode("center")).isEqualTo(TileMode.CLAMP)
    Assertions.assertThat(ImageResizeMode.toTileMode("none")).isEqualTo(TileMode.CLAMP)
    Assertions.assertThat(ImageResizeMode.toTileMode("repeat")).isEqualTo(TileMode.REPEAT)

    // No resizeMode set
    Assertions.assertThat(ImageResizeMode.defaultTileMode()).isEqualTo(TileMode.CLAMP)
  }
}
