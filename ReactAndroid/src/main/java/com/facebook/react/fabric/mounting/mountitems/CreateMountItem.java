/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.fabric.mounting.mountitems;

import androidx.annotation.Nullable;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.fabric.mounting.MountingManager;
import com.facebook.react.uimanager.StateWrapper;
import com.facebook.react.uimanager.ThemedReactContext;

public class CreateMountItem implements MountItem {

  private final String mComponent;
  private final int mRootTag;
  private final int mReactTag;
  private final ThemedReactContext mContext;
  private final @Nullable ReadableMap mProps;
  private final @Nullable StateWrapper mStateWrapper;
  private final boolean mIsLayoutable;

  public CreateMountItem(
      ThemedReactContext context,
      int rootTag,
      int reactTag,
      String component,
      @Nullable ReadableMap props,
      StateWrapper stateWrapper,
      boolean isLayoutable) {
    mContext = context;
    mComponent = component;
    mRootTag = rootTag;
    mReactTag = reactTag;
    mProps = props;
    mStateWrapper = stateWrapper;
    mIsLayoutable = isLayoutable;
  }

  @Override
  public void execute(MountingManager mountingManager) {
    mountingManager.createView(
        mContext, mComponent, mReactTag, mProps, mStateWrapper, mIsLayoutable);
  }

  @Override
  public String toString() {
    return "CreateMountItem ["
        + mReactTag
        + "] - component: "
        + mComponent
        + " - rootTag: "
        + mRootTag
        + " - isLayoutable: "
        + mIsLayoutable;
  }
}
