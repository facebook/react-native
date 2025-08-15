/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.image

import android.graphics.Bitmap
import com.facebook.cache.common.CacheKey
import com.facebook.cache.common.MultiCacheKey
import com.facebook.common.references.CloseableReference
import com.facebook.imagepipeline.bitmaps.PlatformBitmapFactory
import com.facebook.imagepipeline.request.Postprocessor
import java.util.LinkedList

internal class MultiPostprocessor private constructor(postprocessors: List<Postprocessor>) :
    Postprocessor {

  private val postprocessors: List<Postprocessor> = LinkedList(postprocessors)

  override fun getName(): String = "MultiPostProcessor (${postprocessors.joinToString(",")})"

  override fun getPostprocessorCacheKey(): CacheKey =
      MultiCacheKey(postprocessors.map { it.postprocessorCacheKey })

  override fun process(
      sourceBitmap: Bitmap,
      bitmapFactory: PlatformBitmapFactory,
  ): CloseableReference<Bitmap> {
    var prevBitmap: CloseableReference<Bitmap>? = null
    var nextBitmap: CloseableReference<Bitmap>? = null

    try {
      for (p in postprocessors) {
        nextBitmap = p.process(prevBitmap?.get() ?: sourceBitmap, bitmapFactory)
        CloseableReference.closeSafely(prevBitmap)
        prevBitmap = nextBitmap.clone()
      }
      checkNotNull(nextBitmap) {
        ("MultiPostprocessor returned null bitmap - Number of Postprocessors: " +
            postprocessors.size)
      }
      return nextBitmap.clone()
    } finally {
      CloseableReference.closeSafely(nextBitmap)
    }
  }

  companion object {
    @JvmStatic
    fun from(postprocessors: List<Postprocessor>): Postprocessor? {
      return when (postprocessors.size) {
        0 -> null
        1 -> postprocessors[0]
        else -> MultiPostprocessor(postprocessors)
      }
    }
  }
}
