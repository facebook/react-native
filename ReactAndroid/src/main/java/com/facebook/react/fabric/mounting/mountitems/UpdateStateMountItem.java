/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.fabric.mounting.mountitems;

import com.facebook.react.fabric.mounting.MountingManager;
import com.facebook.react.uimanager.StateWrapper;

public class UpdateStateMountItem implements MountItem {

  private final int mReactTag;
  private final StateWrapper mStateWrapper;

  public UpdateStateMountItem(int reactTag, StateWrapper stateWrapper) {
    mReactTag = reactTag;
    mStateWrapper = stateWrapper;
  }

  @Override
  public void execute(MountingManager mountingManager) {
    mountingManager.updateState(mReactTag, mStateWrapper);
  }

  @Override
  public String toString() {
    return "UpdateStateMountItem [" + mReactTag + "] - stateWrapper: " + mStateWrapper;
  }
}
