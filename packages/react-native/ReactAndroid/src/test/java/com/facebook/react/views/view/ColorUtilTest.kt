/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view

import junit.framework.TestCase.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

/** Based on Fresco's DrawableUtilsTest (https://github.com/facebook/fresco). */
@RunWith(RobolectricTestRunner::class)
class ColorUtilTest {
  @Test
  fun testNormalize() {
    assertEquals(0x800B1621U.toInt(), ColorUtil.normalize(11.0, 22.0, 33.0, 0.5))
    assertEquals(0x00000000U.toInt(), ColorUtil.normalize(0.0, 0.0, 0.0, 0.0))
    assertEquals(0xFFFFFFFFU.toInt(), ColorUtil.normalize(255.0, 255.0, 255.0, 1.0))
    assertEquals(0xFF00FFFFU.toInt(), ColorUtil.normalize(-1.0, 256.0, 255.0, 1.1))
    assertEquals(0x000001FFU.toInt(), ColorUtil.normalize(0.4, 0.5, 255.4, -1.0))
  }
}
