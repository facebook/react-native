/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.image;

import androidx.annotation.Nullable;

/**
 * This interface is used from {@link ReactImageManager} to customize the CallerContext object
 * associated with each instance of {@link ReactImageView}.
 */
public interface ReactCallerContextFactory {

  /**
   * This method will be called at the time {@link ReactImageManager} creates {@link ReactImageView}
   *
   * @param surfaceName {@link String} used to log the name of the surface
   * @return an {@link Object} that represents the CallerContext.
   */
  @Nullable
  Object getOrCreateCallerContext(@Nullable String surfaceName, @Nullable String analyticTag);
}
