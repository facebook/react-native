/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view

import android.graphics.PixelFormat
import junit.framework.TestCase.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

/** Based on Fresco's DrawableUtilsTest (https://github.com/facebook/fresco). */
@RunWith(RobolectricTestRunner::class)
class ColorUtilTest {
  @Test
  fun testMultiplyColorAlpha() {
    assertEquals(0x00123456U.toInt(), ColorUtil.multiplyColorAlpha(0xC0123456U.toInt(), 0))
    assertEquals(0x07123456U.toInt(), ColorUtil.multiplyColorAlpha(0xC0123456U.toInt(), 10))
    assertEquals(0x96123456U.toInt(), ColorUtil.multiplyColorAlpha(0xC0123456U.toInt(), 200))
    assertEquals(0xC0123456U.toInt(), ColorUtil.multiplyColorAlpha(0xC0123456U.toInt(), 255))
  }

  @Test
  fun testGetOpacityFromColor() {
    assertEquals(PixelFormat.TRANSPARENT, ColorUtil.getOpacityFromColor(0x00000000))
    assertEquals(PixelFormat.TRANSPARENT, ColorUtil.getOpacityFromColor(0x00123456))
    assertEquals(PixelFormat.TRANSPARENT, ColorUtil.getOpacityFromColor(0x00FFFFFF))
    assertEquals(PixelFormat.TRANSLUCENT, ColorUtil.getOpacityFromColor(0xC0000000.toInt()))
    assertEquals(PixelFormat.TRANSLUCENT, ColorUtil.getOpacityFromColor(0xC0123456.toInt()))
    assertEquals(PixelFormat.TRANSLUCENT, ColorUtil.getOpacityFromColor(0xC0FFFFFF.toInt()))
    assertEquals(PixelFormat.OPAQUE, ColorUtil.getOpacityFromColor(0xFF000000.toInt()))
    assertEquals(PixelFormat.OPAQUE, ColorUtil.getOpacityFromColor(0xFF123456.toInt()))
    assertEquals(PixelFormat.OPAQUE, ColorUtil.getOpacityFromColor(0xFFFFFFFF.toInt()))
  }

  @Test
  fun testNormalize() {
    assertEquals(0x800B1621U.toInt(), ColorUtil.normalize(11.0, 22.0, 33.0, 0.5))
    assertEquals(0x00000000U.toInt(), ColorUtil.normalize(0.0, 0.0, 0.0, 0.0))
    assertEquals(0xFFFFFFFFU.toInt(), ColorUtil.normalize(255.0, 255.0, 255.0, 1.0))
    assertEquals(0xFF00FFFFU.toInt(), ColorUtil.normalize(-1.0, 256.0, 255.0, 1.1))
    assertEquals(0x000001FFU.toInt(), ColorUtil.normalize(0.4, 0.5, 255.4, -1.0))
  }
}
