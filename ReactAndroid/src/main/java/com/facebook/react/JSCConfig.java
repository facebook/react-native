// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react;

import com.facebook.react.bridge.WritableNativeMap;

/**
 * Interface for the configuration object that is passed to JSC.
 */
public interface JSCConfig {
  public WritableNativeMap getConfigMap();
}
