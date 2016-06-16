/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.flat;

import javax.annotation.Nullable;

import java.util.Map;

/**
 * Helper class for computing the source to be used for an Image.
 */
/* package */ class MultiSourceImageHelper {

  /**
   * Chooses the image source with the size closest to the target image size. Must be called only
   * after the layout pass when the sizes of the target image have been computed, and when there
   * are at least two sources to choose from.
   */
  public static @Nullable String getImageSourceFromMultipleSources(
      double targetImageSize,
      Map<String, Double> sources) {
    double bestPrecision = Double.MAX_VALUE;
    String imageSource = null;
    for (Map.Entry<String, Double> source : sources.entrySet()) {
      final double precision = Math.abs(1.0 - (source.getValue()) / targetImageSize);
      if (precision < bestPrecision) {
        bestPrecision = precision;
        imageSource = source.getKey();
      }
    }
    return imageSource;
  }
}
