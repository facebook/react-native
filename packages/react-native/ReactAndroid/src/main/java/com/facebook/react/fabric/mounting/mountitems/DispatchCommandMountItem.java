/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting.mountitems;

import androidx.annotation.UiThread;
import com.facebook.infer.annotation.Nullsafe;

/**
 * This is a common interface for View Command operations. Once we delete the deprecated {@link
 * DispatchIntCommandMountItem}, we can delete this interface too. It provides a set of common
 * operations to simplify generic operations on all types of ViewCommands.
 */
@Nullsafe(Nullsafe.Mode.LOCAL)
public abstract class DispatchCommandMountItem implements MountItem {
  private int mNumRetries = 0;

  @UiThread
  public void incrementRetries() {
    mNumRetries++;
  }

  @UiThread
  public int getRetries() {
    return mNumRetries;
  }
}
