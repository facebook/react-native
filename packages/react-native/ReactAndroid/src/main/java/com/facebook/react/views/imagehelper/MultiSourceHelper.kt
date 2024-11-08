/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.imagehelper

import com.facebook.imagepipeline.core.ImagePipelineFactory
import com.facebook.react.modules.fresco.ImageCacheControl

/** Helper class for dealing with multisource images. */
public object MultiSourceHelper {
  @JvmStatic
  public fun getBestSourceForSize(
      width: Int,
      height: Int,
      sources: List<ImageSource>
  ): MultiSourceResult = getBestSourceForSize(width, height, sources, 1.0)

  /**
   * Chooses the image source with the size closest to the target image size.
   *
   * @param width the width of the view that will be used to display this image
   * @param height the height of the view that will be used to display this image
   * @param sources the list of potential image sources to choose from
   * @param multiplier the area of the view will be multiplied by this number before calculating the
   *   best source; this is useful if the image will be displayed bigger than the view (e.g. zoomed)
   */
  @JvmStatic
  public fun getBestSourceForSize(
      width: Int,
      height: Int,
      sources: List<ImageSource>,
      multiplier: Double
  ): MultiSourceResult {
    // no sources
    if (sources.isEmpty()) {
      return MultiSourceResult(null, null)
    }

    // single source
    if (sources.size == 1) {
      return MultiSourceResult(sources[0], null)
    }

    // For multiple sources, we first need the view's size in order to determine the best source to
    // load. If we haven't been measured yet, return null and wait for onSizeChanged.
    if (width <= 0 || height <= 0) {
      return MultiSourceResult(null, null)
    }
    val imagePipeline = ImagePipelineFactory.getInstance().imagePipeline
    var best: ImageSource? = null
    var bestCached: ImageSource? = null
    val viewArea = width * height * multiplier
    var bestPrecision = Double.MAX_VALUE
    var bestCachePrecision = Double.MAX_VALUE
    for (source in sources) {
      val precision = Math.abs(1.0 - source.size / viewArea)
      if (precision < bestPrecision) {
        bestPrecision = precision
        best = source
      }
      if (precision < bestCachePrecision &&
          source.cacheControl != ImageCacheControl.RELOAD &&
          (imagePipeline.isInBitmapMemoryCache(source.uri) ||
              // TODO: T206445115 isInDiskCacheSync is a blocking operation, we should move this to
              // a separate thread
              imagePipeline.isInDiskCacheSync(source.uri))) {
        bestCachePrecision = precision
        bestCached = source
      }
    }
    if (bestCached != null && best != null && bestCached.source == best.source) {
      bestCached = null
    }
    return MultiSourceResult(best, bestCached)
  }

  public class MultiSourceResult(
      /**
       * Get the best result overall (closest in size to the view's size). Can be null if there were
       * no sources to choose from, or if there were more than 1 sources but width/height were 0.
       */
      @JvmField public val bestResult: ImageSource?,
      /**
       * Get the best result (closest in size to the view's size) that is also in cache. If this
       * would be the same as the source from [.getBestResult], this will return `null` instead.
       */
      @JvmField public val bestResultInCache: ImageSource?
  )
}
