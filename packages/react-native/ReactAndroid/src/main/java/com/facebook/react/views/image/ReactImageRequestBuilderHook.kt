/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.image

import android.net.Uri
import com.facebook.imagepipeline.request.ImageRequestBuilder

/**
 * Global hook for mutating [ImageRequestBuilder] instances created by [ReactImageView].
 *
 * This is a no-op unless a hook is registered via [setHook].
 */
public object ReactImageRequestBuilderHook {
  public fun interface Hook {
    public fun apply(sourceUri: Uri, imageRequestBuilder: ImageRequestBuilder)
  }

  @Volatile private var hook: Hook? = null

  @JvmStatic
  public fun setHook(newHook: Hook?) {
    hook = newHook
  }

  @JvmStatic
  public fun clearHook() {
    hook = null
  }

  internal fun apply(sourceUri: Uri, imageRequestBuilder: ImageRequestBuilder) {
    hook?.apply(sourceUri, imageRequestBuilder)
  }
}
