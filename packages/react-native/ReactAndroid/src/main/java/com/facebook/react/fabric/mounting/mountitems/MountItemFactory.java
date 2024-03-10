/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting.mountitems;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.fabric.events.EventEmitterWrapper;
import com.facebook.react.uimanager.StateWrapper;

/** Factory class that expose creation of {@link MountItem} */
@Nullsafe(Nullsafe.Mode.LOCAL)
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

  /** @return a {@link MountItem} that will be used to preallocate views */
  public static MountItem createPreAllocateViewMountItem(
      int surfaceId,
      int reactTag,
      @NonNull String component,
      @Nullable ReadableMap props,
      @Nullable StateWrapper stateWrapper,
      @Nullable EventEmitterWrapper eventEmitterWrapper,
      boolean isLayoutable) {
    return new PreAllocateViewMountItem(
        surfaceId, reactTag, component, props, stateWrapper, eventEmitterWrapper, isLayoutable);
  }
  /**
   * @return a {@link MountItem} that will be read and execute a collection of MountItems serialized
   *     in the int[] and Object[] received by parameter
   */
  public static MountItem createIntBufferBatchMountItem(
      int surfaceId, int[] intBuf, Object[] objBuf, int commitNumber) {
    return new IntBufferBatchMountItem(surfaceId, intBuf, objBuf, commitNumber);
  }
}
