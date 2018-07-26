// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.react.bridge;

/**
 * Listener interface for memory pressure events.
 */
public interface MemoryPressureListener {

  /**
   * Called when the system generates a memory warning.
   */
  void handleMemoryPressure(int level);

}
