// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.bridge;

/**
 * Listener interface for memory pressure events.
 */
public interface MemoryPressureListener {

  /**
   * Called when the system generates a memory warning.
   */
  void handleMemoryPressure(MemoryPressure level);

}
