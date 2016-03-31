/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.testing;

import com.facebook.react.modules.debug.DeveloperSettings;

public class ReactSettingsForTests implements DeveloperSettings {

  @Override
  public boolean isFpsDebugEnabled() {
    return false;
  }

  @Override
  public boolean isAnimationFpsDebugEnabled() {
    return false;
  }

  @Override
  public boolean isJSDevModeEnabled() {
    return true;
  }

  @Override
  public boolean isJSMinifyEnabled() {
    return false;
  }

  @Override
  public boolean isElementInspectorEnabled() {
    return false;
  }
}
