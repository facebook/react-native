/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting.mountitems;

import androidx.annotation.NonNull;
import com.facebook.react.fabric.mounting.MountingManager;

public class DeleteMountItem implements MountItem {

  private int mReactTag;

  public DeleteMountItem(int reactTag) {
    mReactTag = reactTag;
  }

  @Override
  public void execute(@NonNull MountingManager mountingManager) {
    mountingManager.deleteView(mReactTag);
  }

  @Override
  public String toString() {
    return "DeleteMountItem [" + mReactTag + "]";
  }
}
