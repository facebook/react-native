/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.image

/**
 * This interface is used from [ReactImageManager] to customize the CallerContext object associated
 * with each instance of [ReactImageView].
 */
public fun interface ReactCallerContextFactory {
  /**
   * This method will be called at the time [ReactImageManager] creates [ReactImageView]
   *
   * @param surfaceName [String] used to log the name of the surface
   * @return an [Object] that represents the CallerContext.
   */
  public fun getOrCreateCallerContext(surfaceName: String?, analyticTag: String?): Any?
}
