/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.fabric.mounting.mountitems;

import com.facebook.react.fabric.mounting.MountingManager;

public class DeleteMountItem implements MountItem {

  private int mReactTag;

  public DeleteMountItem(int reactTag) {
    mReactTag = reactTag;
  }

  @Override
  public void execute(MountingManager mountingManager) {
    mountingManager.deleteView(mReactTag);
  }

  @Override
  public String toString() {
    return "DeleteMountItem [" + mReactTag + "]";
  }
}
