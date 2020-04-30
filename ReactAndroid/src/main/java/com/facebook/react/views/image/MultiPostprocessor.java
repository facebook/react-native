/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.image;

import android.graphics.Bitmap;
import com.facebook.cache.common.CacheKey;
import com.facebook.cache.common.MultiCacheKey;
import com.facebook.common.references.CloseableReference;
import com.facebook.imagepipeline.bitmaps.PlatformBitmapFactory;
import com.facebook.imagepipeline.request.Postprocessor;
import java.util.LinkedList;
import java.util.List;

public class MultiPostprocessor implements Postprocessor {
  private final List<Postprocessor> mPostprocessors;

  public static Postprocessor from(List<Postprocessor> postprocessors) {
    switch (postprocessors.size()) {
      case 0:
        return null;
      case 1:
        return postprocessors.get(0);
      default:
        return new MultiPostprocessor(postprocessors);
    }
  }

  private MultiPostprocessor(List<Postprocessor> postprocessors) {
    mPostprocessors = new LinkedList<>(postprocessors);
  }

  @Override
  public String getName() {
    StringBuilder name = new StringBuilder();
    for (Postprocessor p : mPostprocessors) {
      if (name.length() > 0) {
        name.append(",");
      }
      name.append(p.getName());
    }
    name.insert(0, "MultiPostProcessor (");
    name.append(")");
    return name.toString();
  }

  @Override
  public CacheKey getPostprocessorCacheKey() {
    LinkedList<CacheKey> keys = new LinkedList<>();
    for (Postprocessor p : mPostprocessors) {
      keys.push(p.getPostprocessorCacheKey());
    }
    return new MultiCacheKey(keys);
  }

  @Override
  public CloseableReference<Bitmap> process(
      Bitmap sourceBitmap, PlatformBitmapFactory bitmapFactory) {
    CloseableReference<Bitmap> prevBitmap = null, nextBitmap = null;

    try {
      for (Postprocessor p : mPostprocessors) {
        nextBitmap = p.process(prevBitmap != null ? prevBitmap.get() : sourceBitmap, bitmapFactory);
        CloseableReference.closeSafely(prevBitmap);
        prevBitmap = nextBitmap.clone();
      }
      return nextBitmap.clone();
    } finally {
      CloseableReference.closeSafely(nextBitmap);
    }
  }
}
