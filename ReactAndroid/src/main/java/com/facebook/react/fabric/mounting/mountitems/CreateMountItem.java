/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.fabric.mounting.mountitems;

import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.fabric.mounting.MountingManager;
import com.facebook.react.uimanager.ThemedReactContext;

public class CreateMountItem implements MountItem {

  private final String mComponentName;
  private final int mReactTag;
  private final ThemedReactContext mThemedReactContext;
  private final boolean mIsVirtual;
  private final ReadableMap mProps;

  public CreateMountItem(
      ThemedReactContext themedReactContext,
      String componentName,
      int reactTag,
      boolean isVirtual,
      ReadableMap props) {
    mReactTag = reactTag;
    mThemedReactContext = themedReactContext;
    mComponentName = componentName;
    mIsVirtual = isVirtual;
    mProps = props;
  }

  @Override
  public void execute(MountingManager mountingManager) {
    mountingManager.createView(mThemedReactContext, mComponentName, mReactTag, mIsVirtual);
    if (mProps != null && !mIsVirtual) {
      mountingManager.updateProps(mReactTag, mProps);
    }
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
