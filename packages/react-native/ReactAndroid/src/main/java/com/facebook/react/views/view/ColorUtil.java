/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view;

import android.graphics.PixelFormat;
import com.facebook.infer.annotation.Nullsafe;

/**
 * Simple utility class for manipulating colors, based on Fresco's DrawableUtils
 * (https://github.com/facebook/fresco). For a small helper like this, copying is simpler than
 * adding a dependency on com.facebook.fresco.drawee.
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
public class ColorUtil {

  /**
   * Multiplies the color with the given alpha.
   *
   * @param color color to be multiplied
   * @param alpha value between 0 and 255
   * @return multiplied color
   */
  public static int multiplyColorAlpha(int color, int alpha) {
    if (alpha == 255) {
      return color;
    }
    if (alpha == 0) {
      return color & 0x00FFFFFF;
    }
    alpha = alpha + (alpha >> 7); // make it 0..256
    int colorAlpha = color >>> 24;
    int multipliedAlpha = colorAlpha * alpha >> 8;
    return (multipliedAlpha << 24) | (color & 0x00FFFFFF);
  }

  /**
   * Gets the opacity from a color. Inspired by Android ColorDrawable.
   *
   * @param color color to get opacity from
   * @return opacity expressed by one of PixelFormat constants
   */
  public static int getOpacityFromColor(int color) {
    int colorAlpha = color >>> 24;
    if (colorAlpha == 255) {
      return PixelFormat.OPAQUE;
    } else if (colorAlpha == 0) {
      return PixelFormat.TRANSPARENT;
    } else {
      return PixelFormat.TRANSLUCENT;
    }
  }

  /**
   * Converts individual {r, g, b, a} channel values to a single integer representation of the color
   * as 0xAARRGGBB.
   *
   * @param r red channel value, [0, 255]
   * @param g green channel value, [0, 255]
   * @param b blue channel value, [0, 255]
   * @param a alpha channel value, [0, 1]
   * @return integer representation of the color as 0xAARRGGBB
   */
  public static int normalize(double r, double g, double b, double a) {
    return (clamp255(a * 255) << 24) | (clamp255(r) << 16) | (clamp255(g) << 8) | clamp255(b);
  }

  private static int clamp255(double value) {
    return Math.max(0, Math.min(255, (int) Math.round(value)));
  }
}
