/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.renderer.mounting.mountitems;

import androidx.annotation.AnyThread;
import androidx.annotation.NonNull;
import androidx.annotation.UiThread;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.renderer.mounting.MountingManager;

@DoNotStrip
public interface MountItem {

  /** Execute this {@link MountItem} into the operation queue received by parameter. */
  @UiThread
  void execute(@NonNull MountingManager mountingManager);

  @AnyThread
  int getSurfaceId();
}
