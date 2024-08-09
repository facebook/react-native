/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.interfaces.exceptionmanager

import com.facebook.proguard.annotations.DoNotStripAny
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.common.mapbuffer.ReadableMapBuffer

@DoNotStripAny
@UnstableReactNativeAPI
public fun interface ReactJsExceptionHandler {
  public fun reportJsException(errorMap: ReadableMapBuffer?)
}
