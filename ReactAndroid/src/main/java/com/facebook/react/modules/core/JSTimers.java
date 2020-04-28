/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.modules.core;

import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.WritableArray;

public interface JSTimers extends JavaScriptModule {
  void callTimers(WritableArray timerIDs);

  void callIdleCallbacks(double frameTime);

  void emitTimeDriftWarning(String warningMessage);
}
