/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting.mountitems;

import androidx.annotation.NonNull;
import com.facebook.react.fabric.events.EventEmitterWrapper;
import com.facebook.react.fabric.mounting.MountingManager;

public class UpdateEventEmitterMountItem implements MountItem {

  @NonNull private final EventEmitterWrapper mEventHandler;
  private final int mReactTag;

  public UpdateEventEmitterMountItem(int reactTag, @NonNull EventEmitterWrapper EventHandler) {
    mReactTag = reactTag;
    mEventHandler = EventHandler;
  }

  @Override
  public void execute(@NonNull MountingManager mountingManager) {
    mountingManager.updateEventEmitter(mReactTag, mEventHandler);
  }

  @Override
  public String toString() {
    return "UpdateEventEmitterMountItem [" + mReactTag + "]";
  }
}
