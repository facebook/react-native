/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.inspector

import com.facebook.proguard.annotations.DoNotStripAny

@DoNotStripAny
internal enum class TracingState {
  DISABLED, // There is no active trace
  ENABLED_IN_BACKGROUND_MODE, // Trace is currently running in background mode
  ENABLED_IN_CDP_MODE, // Trace is currently running in CDP mode
}
