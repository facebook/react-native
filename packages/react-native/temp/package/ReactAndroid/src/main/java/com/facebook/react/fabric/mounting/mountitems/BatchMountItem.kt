/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting.mountitems

public interface BatchMountItem : MountItem {
  /** @return if the BatchMountItem contains any MountItem */
  public fun isBatchEmpty(): Boolean
}
