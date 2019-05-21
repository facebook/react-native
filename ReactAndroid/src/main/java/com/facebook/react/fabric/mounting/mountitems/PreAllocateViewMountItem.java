/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.fabric.mounting.mountitems;

import static com.facebook.react.fabric.FabricUIManager.DEBUG;
import static com.facebook.react.fabric.FabricUIManager.TAG;

import androidx.annotation.Nullable;
import com.facebook.common.logging.FLog;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.fabric.mounting.MountingManager;
import com.facebook.react.uimanager.ThemedReactContext;

/** {@link MountItem} that is used to pre-allocate views for JS components. */
public class PreAllocateViewMountItem implements MountItem {

  private final String mComponent;
  private final int mRootTag;
  private final int mReactTag;
  private final @Nullable ReadableMap mProps;
  private final ThemedReactContext mContext;
  private final boolean mIsLayoutable;

  public PreAllocateViewMountItem(
      ThemedReactContext context,
      int rootTag,
      int reactTag,
      String component,
      @Nullable ReadableMap props,
      boolean isLayoutable) {
    mContext = context;
    mComponent = component;
    mRootTag = rootTag;
    mProps = props;
    mReactTag = reactTag;
    mIsLayoutable = isLayoutable;
  }

  @Override
  public void execute(MountingManager mountingManager) {
    if (DEBUG) {
      FLog.d(TAG, "Executing pre-allocation of: " + toString());
    }
    mountingManager.preallocateView(mContext, mComponent, mReactTag, mProps, mIsLayoutable);
  }

  @Override
  public String toString() {
    return "PreAllocateViewMountItem ["
        + mReactTag
        + "] - component: "
        + mComponent
        + " rootTag: "
        + mRootTag
        + " isLayoutable: "
        + mIsLayoutable
        + " props: "
        + mProps;
  }
}
