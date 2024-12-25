/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.events

import com.facebook.react.bridge.WritableMap

@Deprecated("Experimental")
public interface SynchronousEventReceiver {
  public fun receiveEvent(
      surfaceId: Int,
      reactTag: Int,
      eventName: String,
      canCoalesceEvent: Boolean,
      params: WritableMap?,
      @EventCategoryDef eventCategory: Int,
      experimental_isSynchronous: Boolean
  ): Unit
}
