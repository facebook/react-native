/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.fabric.mounting.mountitems;

import com.facebook.react.fabric.mounting.MountingManager;
import com.facebook.react.uimanager.ThemedReactContext;

public class CreateMountItem implements MountItem {

  private final String mComponentName;
  private final int mReactTag;
  private final ThemedReactContext mThemedReactContext;
  private final boolean mIsVirtual;

  public CreateMountItem(
      ThemedReactContext themedReactContext,
      String componentName,
      int reactTag,
      boolean isVirtual) {
    mReactTag = reactTag;
    mThemedReactContext = themedReactContext;
    mComponentName = componentName;
    mIsVirtual = isVirtual;
  }

  @Override
  public void execute(MountingManager mountingManager) {
    mountingManager.createView(mThemedReactContext, mComponentName, mReactTag, mIsVirtual);
  }

  public String getComponentName() {
    return mComponentName;
  }

  public ThemedReactContext getThemedReactContext() {
    return mThemedReactContext;
  }

  @Override
  public String toString() {
    return "CreateMountItem [" + mReactTag + "] " + mComponentName;
  }
}
