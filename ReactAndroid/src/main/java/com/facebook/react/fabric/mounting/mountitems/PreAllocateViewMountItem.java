/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.react.fabric.mounting.mountitems;

import com.facebook.react.fabric.mounting.MountingManager;
import com.facebook.react.uimanager.ThemedReactContext;

/**
 * {@link MountItem} that is used to pre-allocate views for JS components.
 */
public class PreAllocateViewMountItem implements MountItem {

  private final String mComponent;
  private final int mRootTag;
  private final ThemedReactContext mContext;

  public PreAllocateViewMountItem(ThemedReactContext context, int rootTag, String component){
    mContext = context;
    mComponent = component;
    mRootTag = rootTag;
  }

  @Override
  public void execute(MountingManager mountingManager) {
    mountingManager.preallocateView(mContext, mComponent);
  }

  @Override
  public String toString() {
    return "[" + mRootTag + "] - Preallocate " + mComponent;
  }
}
