/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.internal;

import com.facebook.infer.annotation.Nullsafe;
import com.facebook.react.bridge.UiThreadUtil;

/** An implementation of ChoreographerProvider that directly uses android.view.Choreographer. */
@Nullsafe(Nullsafe.Mode.LOCAL)
public final class AndroidChoreographerProvider implements ChoreographerProvider {

  public static final class AndroidChoreographer implements ChoreographerProvider.Choreographer {
    private final android.view.Choreographer sInstance = android.view.Choreographer.getInstance();

    public void postFrameCallback(android.view.Choreographer.FrameCallback callback) {
      sInstance.postFrameCallback(callback);
    }

    public void removeFrameCallback(android.view.Choreographer.FrameCallback callback) {
      sInstance.removeFrameCallback(callback);
    }
  }

  private static class Holder {
    private static final AndroidChoreographerProvider INSTANCE = new AndroidChoreographerProvider();
  }

  public static AndroidChoreographerProvider getInstance() {
    return Holder.INSTANCE;
  }

  public Choreographer getChoreographer() {
    UiThreadUtil.assertOnUiThread();
    return new AndroidChoreographer();
  }
}
