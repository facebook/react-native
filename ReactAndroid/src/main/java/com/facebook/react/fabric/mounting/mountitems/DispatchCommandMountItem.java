/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.fabric.mounting.mountitems;

import android.support.annotation.Nullable;
import com.facebook.react.fabric.mounting.MountingManager;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.UiThreadUtil;

public class DispatchCommandMountItem implements MountItem {

  private final int mReactTag;
  private final int mCommandId;
  private final @Nullable ReadableArray mCommandArgs;

  public DispatchCommandMountItem(
      int reactTag, int commandId, @Nullable ReadableArray commandArgs) {
    mReactTag = reactTag;
    mCommandId = commandId;
    mCommandArgs = commandArgs;
  }

  @Override
  public void execute(MountingManager mountingManager) {
    UiThreadUtil.assertOnUiThread();
    mountingManager.receiveCommand(mReactTag, mCommandId, mCommandArgs);
  }

  @Override
  public String toString() {
    return "DispatchCommandMountItem [" + mReactTag + "] " + mCommandId;
  }
}
