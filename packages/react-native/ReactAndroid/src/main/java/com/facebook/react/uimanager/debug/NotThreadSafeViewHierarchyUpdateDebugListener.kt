/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.debug

import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel

/**
 * A listener that is notified about view hierarchy update events. This listener should only be used
 * for debug purposes and should not affect application state.
 *
 * NB: while [onViewHierarchyUpdateFinished] will always be called from the UI thread, there are no
 * guarantees what thread onViewHierarchyUpdateEnqueued is called on.
 */
@Deprecated(
    "NotThreadSafeViewHierarchyUpdateDebugListener will be deleted in the new architecture."
)
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
internal interface NotThreadSafeViewHierarchyUpdateDebugListener {
  /** Called when `UIManagerModule` enqueues a UI batch to be dispatched to the main thread. */
  fun onViewHierarchyUpdateEnqueued()

  /** Called from the main thread after a UI batch has been applied to all root views. */
  fun onViewHierarchyUpdateFinished()
}
