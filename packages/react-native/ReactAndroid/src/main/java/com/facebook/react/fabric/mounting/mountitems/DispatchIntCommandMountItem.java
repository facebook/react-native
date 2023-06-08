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
import com.facebook.react.fabric.mounting.MountingManager;

final class DispatchIntCommandMountItem extends DispatchCommandMountItem {

  private final int mSurfaceId;
  private final int mReactTag;
  private final int mCommandId;
  private final @Nullable ReadableArray mCommandArgs;

  DispatchIntCommandMountItem(
      int surfaceId, int reactTag, int commandId, @Nullable ReadableArray commandArgs) {
    mSurfaceId = surfaceId;
    mReactTag = reactTag;
    mCommandId = commandId;
    mCommandArgs = commandArgs;
  }

  @Override
  public int getSurfaceId() {
    return mSurfaceId;
  }

  @Override
  public void execute(@NonNull MountingManager mountingManager) {
    mountingManager.receiveCommand(mSurfaceId, mReactTag, mCommandId, mCommandArgs);
  }

  @Override
  @NonNull
  public String toString() {
    return "DispatchIntCommandMountItem [" + mReactTag + "] " + mCommandId;
  }
}
