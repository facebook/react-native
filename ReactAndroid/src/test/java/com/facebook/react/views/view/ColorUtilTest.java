/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view;

import android.graphics.PixelFormat;

import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.powermock.core.classloader.annotations.PowerMockIgnore;
import org.powermock.modules.junit4.rule.PowerMockRule;
import org.robolectric.RobolectricTestRunner;

import static org.junit.Assert.*;

/**
 * Based on Fresco's DrawableUtilsTest (https://github.com/facebook/fresco).
 */
@RunWith(RobolectricTestRunner.class)
@PowerMockIgnore({"org.mockito.*", "org.robolectric.*", "android.*"})
public class ColorUtilTest {

  @Rule
  public PowerMockRule rule = new PowerMockRule();

  @Test
  public void testMultiplyColorAlpha() {
    assertEquals(0x00123456, ColorUtil.multiplyColorAlpha(0xC0123456, 0));
    assertEquals(0x07123456, ColorUtil.multiplyColorAlpha(0xC0123456, 10));
    assertEquals(0x96123456, ColorUtil.multiplyColorAlpha(0xC0123456, 200));
    assertEquals(0xC0123456, ColorUtil.multiplyColorAlpha(0xC0123456, 255));
  }

  @Test
  public void testGetOpacityFromColor() {
    assertEquals(PixelFormat.TRANSPARENT, ColorUtil.getOpacityFromColor(0x00000000));
    assertEquals(PixelFormat.TRANSPARENT, ColorUtil.getOpacityFromColor(0x00123456));
    assertEquals(PixelFormat.TRANSPARENT, ColorUtil.getOpacityFromColor(0x00FFFFFF));
    assertEquals(PixelFormat.TRANSLUCENT, ColorUtil.getOpacityFromColor(0xC0000000));
    assertEquals(PixelFormat.TRANSLUCENT, ColorUtil.getOpacityFromColor(0xC0123456));
    assertEquals(PixelFormat.TRANSLUCENT, ColorUtil.getOpacityFromColor(0xC0FFFFFF));
    assertEquals(PixelFormat.OPAQUE, ColorUtil.getOpacityFromColor(0xFF000000));
    assertEquals(PixelFormat.OPAQUE, ColorUtil.getOpacityFromColor(0xFF123456));
    assertEquals(PixelFormat.OPAQUE, ColorUtil.getOpacityFromColor(0xFFFFFFFF));
  }
}
