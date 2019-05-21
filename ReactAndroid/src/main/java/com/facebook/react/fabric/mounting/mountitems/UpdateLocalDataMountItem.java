/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.fabric.mounting.mountitems;

import com.facebook.react.fabric.mounting.MountingManager;
import com.facebook.react.bridge.ReadableMap;

public class UpdateLocalDataMountItem implements MountItem {

  private final int mReactTag;
  private final ReadableMap mNewLocalData;

  public UpdateLocalDataMountItem(int reactTag, ReadableMap newLocalData) {
    mReactTag = reactTag;
    mNewLocalData = newLocalData;
  }

  @Override
  public void execute(MountingManager mountingManager) {
    mountingManager.updateLocalData(mReactTag, mNewLocalData);
  }

  public ReadableMap getNewLocalData() {
    return mNewLocalData;
  }

  @Override
  public String toString() {
    return "UpdateLocalDataMountItem [" + mReactTag + "] - localData: " + mNewLocalData;
  }
}
