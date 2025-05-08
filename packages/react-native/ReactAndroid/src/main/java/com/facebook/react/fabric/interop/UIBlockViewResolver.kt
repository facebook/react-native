/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.interop

import android.view.View
import com.facebook.react.common.annotations.UnstableReactNativeAPI

/**
 * This interface is used as receiver parameter for [UIBlock].
 *
 * Users can invoke [resolveView] on this instance to get an Android [View] from the view tag.
 *
 * @deprecated When developing new libraries for Fabric you should instead use
 *   [com.facebook.react.bridge.UIManagerListener] or View Commands to achieve a same results.
 */
@UnstableReactNativeAPI
@Deprecated("Use UIManagerListener or View Commands instead of addUIBlock and prependUIBlock.")
public interface UIBlockViewResolver {
  /**
   * Resolves a [View] from the given react tag.
   *
   * @param reactTag the react tag of the view to resolve
   * @return the Android [View] instance for the given tag or null if the view is not found
   */
  public fun resolveView(reactTag: Int): View?
}
