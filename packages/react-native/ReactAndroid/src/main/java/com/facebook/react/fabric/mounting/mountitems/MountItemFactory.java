/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting.mountitems;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.react.bridge.ReadableArray;

/** Factory class that expose creation of {@link MountItem} */
public class MountItemFactory {

  /** @return a {@link DispatchCommandMountItem} for commands identified by an int */
  public static DispatchCommandMountItem createDispatchCommandMountItem(
      int surfaceId, int reactTag, int commandId, @Nullable ReadableArray commandArgs) {
    return new DispatchIntCommandMountItem(surfaceId, reactTag, commandId, commandArgs);
  }

  /** @return a {@link DispatchCommandMountItem} for commands identified by a String */
  public static DispatchCommandMountItem createDispatchCommandMountItem(
      int surfaceId, int reactTag, @NonNull String commandId, @Nullable ReadableArray commandArgs) {
    return new DispatchStringCommandMountItem(surfaceId, reactTag, commandId, commandArgs);
  }

  /** @return a {@link MountItem} that will control the execution of an AccessibilityEvent */
  public static MountItem createSendAccessibilityEventMountItem(
      int surfaceId, int reactTag, int eventType) {
    return new SendAccessibilityEventMountItem(surfaceId, reactTag, eventType);
  }
}
