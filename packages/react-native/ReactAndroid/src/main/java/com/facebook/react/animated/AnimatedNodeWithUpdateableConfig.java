/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated;

import com.facebook.react.bridge.ReadableMap;

/** Indicates that AnimatedNode is able to receive native config updates. */
interface AnimatedNodeWithUpdateableConfig {
  void onUpdateConfig(ReadableMap config);
}
