// Copyright (c) Facebook, Inc. and its affiliates.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

package com.facebook.react.bridge;

import androidx.annotation.Keep;

/** Interface to the JavaScript Systrace Module */
@Keep
public interface Systrace extends JavaScriptModule {
  @Keep
  void setEnabled(boolean enabled);
}
