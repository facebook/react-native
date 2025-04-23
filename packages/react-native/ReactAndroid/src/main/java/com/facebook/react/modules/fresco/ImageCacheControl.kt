/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.fresco

public enum class ImageCacheControl {
  /** Uses OkHttp's default cache control policy with no store. */
  DEFAULT,
  /**
   * The data for the URL will be loaded from the originating source. No existing cache data should
   * be used to satisfy a URL load request.
   */
  RELOAD,
  /**
   * The existing cache data will be used to satisfy a request, regardless of its age or expiration
   * date. If there is no existing data in the cache corresponding to a URL load request, the data
   * is loaded from the originating source.
   */
  FORCE_CACHE,
  /**
   * The existing cache data will be used to satisfy a request, regardless of its age or expiration
   * date. If there is no existing data in the cache corresponding to a URL load request, no attempt
   * is made to load the data from the originating source, and the load is considered to have
   * failed.
   */
  ONLY_IF_CACHED,
}
