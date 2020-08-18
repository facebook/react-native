/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.image;

import com.facebook.react.uimanager.ThemedReactContext;

/**
 * This interface is used from {@link ReactImageManager} to customize the CallerContext object
 * associated with each instance of {@link ReactImageView}.
 */
public interface ReactCallerContextFactory {

  /**
   * This method will be called at the time {@link ReactImageManager} creates {@link ReactImageView}
   *
   * @param reactContext {@link ThemedReactContext} used to create the {@link ReactImageView}
   * @return an {@link Object} that represents the CallerContext.
   */
  Object getOrCreateCallerContext(ThemedReactContext reactContext);
}
