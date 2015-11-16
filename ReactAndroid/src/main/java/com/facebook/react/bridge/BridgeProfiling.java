// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.bridge;

import com.facebook.proguard.annotations.DoNotStrip;

/**
 * Interface to the JavaScript BridgeProfiling Module
 */
@DoNotStrip
public interface BridgeProfiling extends JavaScriptModule{
  @DoNotStrip
  void setEnabled(boolean enabled);
}
