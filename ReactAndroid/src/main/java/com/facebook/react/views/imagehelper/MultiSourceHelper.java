/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.imagehelper;

import javax.annotation.Nullable;

import java.util.List;

import com.facebook.imagepipeline.core.ImagePipeline;
import com.facebook.imagepipeline.core.ImagePipelineFactory;
import com.facebook.react.views.imagehelper.ImageSource;

/**
 * Helper class for dealing with multisource images.
 */
public class MultiSourceHelper {

  public static class MultiSourceResult {
    private final @Nullable ImageSource bestResult;
    private final @Nullable ImageSource bestResultInCache;

    private MultiSourceResult(
      @Nullable ImageSource bestResult,
      @Nullable ImageSource bestResultInCache) {
      this.bestResult = bestResult;
      this.bestResultInCache = bestResultInCache;
    }

    /**
     * Get the best result overall (closest in size to the view's size). Can be null if there were
     * no sources to choose from, or if there were more than 1 sources but width/height were 0.
     */
    public @Nullable ImageSource getBestResult() {
      return bestResult;
    }

    /**
     * Get the best result (closest in size to the view's size) that is also in cache. If this would
     * be the same as the source from {@link #getBestResult()}, this will return {@code null}
     * instead.
     */
    public @Nullable ImageSource getBestResultInCache() {
      return bestResultInCache;
    }
  }

  public static MultiSourceResult getBestSourceForSize(
    int width,
    int height,
    List<ImageSource> sources) {
    return getBestSourceForSize(width, height, sources, 1.0d);
  }

  /**
   * Chooses the image source with the size closest to the target image size.
   *
   * @param width the width of the view that will be used to display this image
   * @param height the height of the view that will be used to display this image
   * @param sources the list of potential image sources to choose from
   * @param multiplier the area of the view will be multiplied by this number before calculating the
   *        best source; this is useful if the image will be displayed bigger than the view
   *        (e.g. zoomed)
   */
  public static MultiSourceResult getBestSourceForSize(
    int width,
    int height,
    List<ImageSource> sources,
    double multiplier) {
    // no sources
    if (sources.isEmpty()) {
      return new MultiSourceResult(null, null);
    }

    // single source
    if (sources.size() == 1) {
      return new MultiSourceResult(sources.get(0), null);
    }

    // For multiple sources, we first need the view's size in order to determine the best source to
    // load. If we haven't been measured yet, return null and wait for onSizeChanged.
    if (width <= 0 || height <= 0) {
      return new MultiSourceResult(null, null);
    }

    ImagePipeline imagePipeline = ImagePipelineFactory.getInstance().getImagePipeline();
    ImageSource best = null;
    ImageSource bestCached = null;
    final double viewArea = width * height * multiplier;
    double bestPrecision = Double.MAX_VALUE;
    double bestCachePrecision = Double.MAX_VALUE;
    for (ImageSource source : sources) {
      double precision = Math.abs(1.0 - source.getSize() / viewArea);
      if (precision < bestPrecision) {
        bestPrecision = precision;
        best = source;
      }
      if (precision < bestCachePrecision &&
        (imagePipeline.isInBitmapMemoryCache(source.getUri()) ||
          imagePipeline.isInDiskCacheSync(source.getUri()))) {
        bestCachePrecision = precision;
        bestCached = source;
      }
    }
    if (bestCached != null && best != null && bestCached.getSource().equals(best.getSource())) {
      bestCached = null;
    }
    return new MultiSourceResult(best, bestCached);
  }
}
