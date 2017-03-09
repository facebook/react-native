// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react.bridge;

/**
 * Interface on native modules for the bridge to call for TTI start and end markers.
 */
public interface NativeModuleLogger {

  void startConstantsMapConversion();
  void endConstantsMapConversion();
}
