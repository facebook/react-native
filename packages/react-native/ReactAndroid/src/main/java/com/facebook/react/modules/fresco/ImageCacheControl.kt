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
}
