/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react;

import androidx.annotation.Nullable;
import com.facebook.react.interfaces.ReactHostInterface;

/** Interface that represents an instance of a React Native application */
public interface ReactApplication {

  /** Get the default {@link ReactNativeHost} for this app. */
  ReactNativeHost getReactNativeHost();

  /**
   * Get the default {@link ReactHostInterface} for this app. This method will be used by the new
   * architecture of react native
   */
  default @Nullable ReactHostInterface getReactHostInterface() {
    return null;
  }
}
