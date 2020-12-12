/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uiapp;

import androidx.annotation.VisibleForTesting;
import com.facebook.jni.HybridData;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.turbomodule.core.ReactPackageTurboModuleManagerDelegate;
import com.facebook.soloader.SoLoader;
import java.util.List;

/** This class is responsible for creating all the TurboModules for the RNTester app. */
public class RNTesterTurboModuleManagerDelegate extends ReactPackageTurboModuleManagerDelegate {
  private static volatile boolean sIsSoLibraryLoaded;

  protected native HybridData initHybrid();

  @VisibleForTesting
  native boolean canCreateTurboModule(String moduleName);

  public RNTesterTurboModuleManagerDelegate(
      ReactApplicationContext context, List<ReactPackage> packages) {
    super(context, packages);
  }

  @Override
  protected void maybeLoadOtherSoLibraries() {
    maybeLoadSoLibraries();
  }

  // Prevents issues with initializer interruptions.
  private static synchronized void maybeLoadSoLibraries() {
    if (!sIsSoLibraryLoaded) {
      SoLoader.loadLibrary("rntester_appmodules");
      sIsSoLibraryLoaded = true;
    }
  }
}
