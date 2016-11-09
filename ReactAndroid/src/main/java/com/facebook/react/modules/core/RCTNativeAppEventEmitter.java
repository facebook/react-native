/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.modules.core;

import javax.annotation.Nullable;

import com.facebook.react.bridge.JavaScriptModule;

/**
 * Module that handles global application events.
 */
public interface RCTNativeAppEventEmitter extends JavaScriptModule {
  void emit(String eventName, @Nullable Object data);
}

