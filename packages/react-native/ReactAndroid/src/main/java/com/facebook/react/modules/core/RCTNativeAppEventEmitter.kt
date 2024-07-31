/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.core

import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.bridge.JavaScriptModule

/** Module that handles global application events. */
@DoNotStrip
public fun interface RCTNativeAppEventEmitter : JavaScriptModule {
  public fun emit(eventName: String, data: Any?)
}
