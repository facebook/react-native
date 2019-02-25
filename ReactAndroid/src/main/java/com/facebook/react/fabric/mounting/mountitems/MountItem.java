/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.fabric.mounting.mountitems;

import android.support.annotation.UiThread;
import com.facebook.react.fabric.mounting.MountingManager;

public interface MountItem {

  /** Execute this {@link MountItem} into the operation queue received by parameter. */
  @UiThread
  void execute(MountingManager mountingManager);
}
