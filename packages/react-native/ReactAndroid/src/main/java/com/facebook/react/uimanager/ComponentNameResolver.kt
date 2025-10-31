/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import com.facebook.proguard.annotations.DoNotStripAny

/**
 * Interface for resolving component names registered in React Native.
 *
 * This interface provides access to all registered component names in the React Native runtime,
 * which is useful for debugging and inspection purposes.
 */
@DoNotStripAny
internal interface ComponentNameResolver {
  /**
   * Gets the list of all component names registered in React Native.
   *
   * @return An array of all registered component names
   */
  val componentNames: Array<String>
}
