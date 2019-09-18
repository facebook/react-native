/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.testing;

import com.facebook.react.modules.debug.interfaces.DeveloperSettings;

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

  @Override
  public boolean isNuclideJSDebugEnabled() {
    return false;
  }

  @Override
  public boolean isRemoteJSDebugEnabled() {
    return false;
  }

  @Override
  public void setRemoteJSDebugEnabled(boolean remoteJSDebugEnabled) {}

  @Override
  public boolean isStartSamplingProfilerOnInit() {
    return false;
  }

  @Override
  public void addMenuItem(String title) {}
}
