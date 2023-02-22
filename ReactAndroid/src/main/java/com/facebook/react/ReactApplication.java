/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react;

public interface ReactApplication {

  /** Get the default {@link ReactNativeHost} for this app. */
  ReactNativeHost getReactNativeHost();
}
