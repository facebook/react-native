/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting.mountitems;

import static com.facebook.react.fabric.FabricUIManager.IS_DEVELOPMENT_ENVIRONMENT;

import androidx.annotation.NonNull;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.fabric.mounting.MountingManager;

public class UpdatePropsMountItem implements MountItem {

  private final int mReactTag;
  @NonNull private final ReadableMap mUpdatedProps;

  public UpdatePropsMountItem(int reactTag, @NonNull ReadableMap updatedProps) {
    mReactTag = reactTag;
    mUpdatedProps = updatedProps;
  }

  @Override
  public void execute(@NonNull MountingManager mountingManager) {
    mountingManager.updateProps(mReactTag, mUpdatedProps);
  }

  @Override
  public String toString() {
    StringBuilder result =
        new StringBuilder("UpdatePropsMountItem [").append(mReactTag).append("]");

    if (IS_DEVELOPMENT_ENVIRONMENT) {
      result.append(" props: ").append(mUpdatedProps);
    }

    return result.toString();
  }
}
