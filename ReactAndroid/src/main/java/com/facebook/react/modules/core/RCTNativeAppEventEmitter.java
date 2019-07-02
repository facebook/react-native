/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.modules.core;

import com.facebook.react.bridge.JavaScriptModule;
import javax.annotation.Nullable;

/** Module that handles global application events. */
public interface RCTNativeAppEventEmitter extends JavaScriptModule {
  void emit(String eventName, @Nullable Object data);
}
