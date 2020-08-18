/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager;

import com.facebook.react.bridge.ReadableNativeMap;
import com.facebook.react.bridge.WritableMap;

/**
 * This is a wrapper that can be used for passing State objects from Fabric C++ core to
 * platform-specific components in Java. State allows you to break out of uni-directional dataflow
 * by calling updateState, which communicates state back to the C++ layer.
 */
public interface StateWrapper {
  /**
   * Get a ReadableNativeMap object from the C++ layer, which is a K/V map of string keys to values.
   */
  ReadableNativeMap getState();

  /** Pass a map of values back to the C++ layer. */
  void updateState(WritableMap map);
}
