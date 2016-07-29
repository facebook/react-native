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

import android.content.Context;
import android.content.res.Resources;
import android.net.Uri;

import com.facebook.imagepipeline.request.ImageRequest;
import com.facebook.imagepipeline.request.ImageRequestBuilder;

/* package */ class ImageRequestHelper {

  /* package */ static @Nullable ImageRequest createImageRequest(
      Context context,
      @Nullable String source) {
    if (source == null) {
      return null;
    }

    final ImageRequestBuilder imageRequestBuilder;
    if (isUriResource(source)) {
      imageRequestBuilder = ImageRequestBuilder.newBuilderWithSource(Uri.parse(source));
    } else {
      Resources resources = context.getResources();
      int resId = resources.getIdentifier(
          source,
          "drawable",
          context.getPackageName());
      imageRequestBuilder = ImageRequestBuilder.newBuilderWithResourceId(resId);
    }

    return imageRequestBuilder.build();
  }

  private static boolean isUriResource(String source) {
    return
      source.startsWith("http://") ||
      source.startsWith("https://") ||
      source.startsWith("data:") ||
      source.startsWith("file:///") ||
      source.startsWith("content://");
  }
}
