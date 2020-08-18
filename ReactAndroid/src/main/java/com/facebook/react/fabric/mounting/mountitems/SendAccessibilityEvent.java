/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting.mountitems;

import androidx.annotation.NonNull;
import com.facebook.react.fabric.mounting.MountingManager;

public class SendAccessibilityEvent implements MountItem {

  private final int mReactTag;
  private final int mEventType;

  public SendAccessibilityEvent(int reactTag, int eventType) {
    mReactTag = reactTag;
    mEventType = eventType;
  }

  @Override
  public void execute(@NonNull MountingManager mountingManager) {
    mountingManager.sendAccessibilityEvent(mReactTag, mEventType);
  }

  @Override
  public String toString() {
    return "SendAccessibilityEvent [" + mReactTag + "] " + mEventType;
  }
}
