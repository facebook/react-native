/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION") // Deprecation is added for backward compatibility reasons

package com.facebook.react.fabric.interop

import com.facebook.react.common.annotations.UnstableReactNativeAPI

/**
 * Interop Interface added to support `addUiBlock` and `prependUIBlock` methods in Fabric.
 * Historically those methods were only available in `UIManagerModule` (Paper, the old renderer).
 * We're re-adding them to Fabric to make it easier to migrate.
 *
 * @deprecated When developing new libraries for Fabric you should instead use
 *   [com.facebook.react.bridge.UIManagerListener] or View Commands to achieve a same results.
 */
@UnstableReactNativeAPI
@Deprecated("Use UIManagerListener or View Commands instead of addUIBlock and prependUIBlock.")
public fun interface UIBlock {
  /**
   * A method that will allow you to call [UIBlockViewResolver.resolveView] to obtain a view
   * instance for a given tag.
   */
  public fun execute(resolver: UIBlockViewResolver)
}
