/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.image

import com.facebook.drawee.drawable.ScalingUtils
import org.assertj.core.api.Assertions
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ImageResizeModeTest {

  @Test
  fun testImageResizeMode() {
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

    // No resizeMode set
    Assertions.assertThat(ImageResizeMode.defaultValue())
        .isEqualTo(ScalingUtils.ScaleType.CENTER_CROP)
  }
}
