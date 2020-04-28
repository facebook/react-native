/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.fabric.mounting.mountitems;

import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.fabric.mounting.MountingManager;

public class UpdatePropsMountItem implements MountItem {

  private final int mReactTag;
  private final ReadableMap mUpdatedProps;

  public UpdatePropsMountItem(int reactTag, ReadableMap updatedProps) {
    mReactTag = reactTag;
    mUpdatedProps = updatedProps;
  }

  @Override
  public void execute(MountingManager mountingManager) {
    mountingManager.updateProps(mReactTag, mUpdatedProps);
  }

  @Override
  public String toString() {
    return "UpdatePropsMountItem [" + mReactTag + "] - props: " + mUpdatedProps;
  }
}
