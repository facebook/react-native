/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.fabric.mounting.mountitems;

import com.facebook.react.fabric.mounting.MountingManager;

public class SendAccessibilityEvent implements MountItem {

  private final int mReactTag;
  private final int mEventType;

  public SendAccessibilityEvent(int reactTag, int eventType) {
    mReactTag = reactTag;
    mEventType = eventType;
  }

  @Override
  public void execute(MountingManager mountingManager) {
    mountingManager.sendAccessibilityEvent(mReactTag, mEventType);
  }

  @Override
  public String toString() {
    return "SendAccessibilityEvent [" + mReactTag + "] " + mEventType;
  }
}
