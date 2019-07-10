/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.fabric.mounting.mountitems;

import com.facebook.react.fabric.mounting.MountingManager;
import com.facebook.react.uimanager.ThemedReactContext;

public class CreateMountItem implements MountItem {

  private final String mComponent;
  private final int mRootTag;
  private final int mReactTag;
  private final ThemedReactContext mContext;
  private final boolean mIsLayoutable;

  public CreateMountItem(
      ThemedReactContext context,
      int rootTag,
      int reactTag,
      String component,
      boolean isLayoutable) {
    mContext = context;
    mComponent = component;
    mRootTag = rootTag;
    mReactTag = reactTag;
    mIsLayoutable = isLayoutable;
  }

  @Override
  public void execute(MountingManager mountingManager) {
    mountingManager.createView(mContext, mComponent, mReactTag, null, null, mIsLayoutable);
  }

  @Override
  public String toString() {
    return "CreateMountItem [" + mReactTag + "]";
  }
}
