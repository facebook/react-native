/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.fresco

import com.facebook.imagepipeline.request.ImageRequest
import com.facebook.imagepipeline.request.ImageRequestBuilder
import com.facebook.react.bridge.ReadableMap

/** Extended ImageRequest with request headers */
public class ReactNetworkImageRequest
private constructor(
    builder: ImageRequestBuilder,
    /** Headers for the request */
    internal val headers: ReadableMap?
) : ImageRequest(builder) {

  public companion object {
    @JvmStatic
    public fun fromBuilderWithHeaders(
        builder: ImageRequestBuilder,
        headers: ReadableMap?
    ): ReactNetworkImageRequest {
      return ReactNetworkImageRequest(builder, headers)
    }
  }
}
