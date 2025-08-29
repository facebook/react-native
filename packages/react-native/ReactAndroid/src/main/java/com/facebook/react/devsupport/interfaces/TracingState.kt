/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.interfaces

import com.facebook.proguard.annotations.DoNotStripAny

// Keep in sync with `TracingState.h`
// JNI wrapper for `jsinspector_modern::Tracing::TracingState`.
@DoNotStripAny
public enum class TracingState {
  DISABLED, // There is no active trace
  ENABLEDINBACKGROUNDMODE, // Trace is currently running in background mode
  ENABLEDINCDPMODE, // Trace is currently running in CDP mode
}
