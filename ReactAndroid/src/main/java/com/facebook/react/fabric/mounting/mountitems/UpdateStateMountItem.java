/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting.mountitems;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import com.facebook.react.fabric.mounting.MountingManager;
import com.facebook.react.uimanager.StateWrapper;

public class UpdateStateMountItem implements MountItem {

  private final int mReactTag;
  @Nullable private final StateWrapper mStateWrapper;

  public UpdateStateMountItem(int reactTag, @Nullable StateWrapper stateWrapper) {
    mReactTag = reactTag;
    mStateWrapper = stateWrapper;
  }

  @Override
  public void execute(@NonNull MountingManager mountingManager) {
    mountingManager.updateState(mReactTag, mStateWrapper);
  }

  @Override
  public String toString() {
    return "UpdateStateMountItem [" + mReactTag + "] - stateWrapper: " + mStateWrapper;
  }
}
