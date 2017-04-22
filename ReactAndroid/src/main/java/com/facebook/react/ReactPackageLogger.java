// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.react;

/**
 * Interface for the bridge to call for TTI start and end markers.
 */
public interface ReactPackageLogger {

  void startProcessPackage();
  void endProcessPackage();
}
