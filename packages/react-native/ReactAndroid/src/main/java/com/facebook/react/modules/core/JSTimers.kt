/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.core

import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.bridge.JavaScriptModule
import com.facebook.react.bridge.WritableArray

@DoNotStrip
public interface JSTimers : JavaScriptModule {
  public fun callTimers(timerIDs: WritableArray)

  public fun callIdleCallbacks(frameTime: Double)

  public fun emitTimeDriftWarning(warningMessage: String)
}
