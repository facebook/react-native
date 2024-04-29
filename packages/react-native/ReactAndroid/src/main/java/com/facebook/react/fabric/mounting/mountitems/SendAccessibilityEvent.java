/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting.mountitems;

import androidx.annotation.NonNull;
import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.bridge.ReactSoftExceptionLogger;
import com.facebook.react.bridge.RetryableMountingLayerException;
import com.facebook.react.fabric.mounting.MountingManager;

@Nullsafe(Nullsafe.Mode.LOCAL)
class SendAccessibilityEvent implements MountItem {

  private final String TAG = "Fabric.SendAccessibilityEvent";

  private final int mSurfaceId;
  private final int mReactTag;
  private final int mEventType;

  public SendAccessibilityEvent(int surfaceId, int reactTag, int eventType) {
    mSurfaceId = surfaceId;
    mReactTag = reactTag;
    mEventType = eventType;
  }

  @Override
  public void execute(@NonNull MountingManager mountingManager) {
    try {
      mountingManager.sendAccessibilityEvent(mSurfaceId, mReactTag, mEventType);
    } catch (RetryableMountingLayerException e) {
      // Accessibility events are similar to commands in that they're imperative
      // calls from JS, disconnected from the commit lifecycle, and therefore
      // inherently unpredictable and dangerous. If we encounter a "retryable"
      // error, that is, a known category of errors that this is likely to hit
      // due to race conditions (like the view disappearing after the event is
      // queued and before it executes), we log a soft exception and continue along.
      // Other categories of errors will still cause a hard crash.
      ReactSoftExceptionLogger.logSoftException(TAG, e);
    }
  }

  @Override
  public int getSurfaceId() {
    return mSurfaceId;
  }

  @Override
  public String toString() {
    return "SendAccessibilityEvent [" + mReactTag + "] " + mEventType;
  }
}
