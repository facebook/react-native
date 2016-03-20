// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.bridge;

import com.facebook.proguard.annotations.DoNotStrip;

/**
 * Interface to the JavaScript Systrace Module
 */
@DoNotStrip
public interface Systrace extends JavaScriptModule{
  @DoNotStrip
  void setEnabled(boolean enabled);
}
