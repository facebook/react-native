/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.fresco;

import com.facebook.imagepipeline.request.ImageRequest;
import com.facebook.imagepipeline.request.ImageRequestBuilder;
import com.facebook.react.bridge.ReadableMap;

/** Extended ImageRequest with request headers */
public class ReactNetworkImageRequest extends ImageRequest {

  /** Headers for the request */
  private final ReadableMap mHeaders;

  public static ReactNetworkImageRequest fromBuilderWithHeaders(
      ImageRequestBuilder builder, ReadableMap headers) {
    return new ReactNetworkImageRequest(builder, headers);
  }

  protected ReactNetworkImageRequest(ImageRequestBuilder builder, ReadableMap headers) {
    super(builder);
    mHeaders = headers;
  }

  public ReadableMap getHeaders() {
    return mHeaders;
  }
}
