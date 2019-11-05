/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.core;

import androidx.annotation.Nullable;
import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.bridge.JavaScriptModule;

/** Module that handles global application events. */
@DoNotStrip
public interface RCTNativeAppEventEmitter extends JavaScriptModule {
  void emit(String eventName, @Nullable Object data);
}
