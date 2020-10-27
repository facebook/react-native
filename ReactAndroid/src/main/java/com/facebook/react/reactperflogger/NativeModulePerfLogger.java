/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.perflogger;

import com.facebook.jni.HybridData;
import com.facebook.soloader.SoLoader;

public abstract class NativeModulePerfLogger {
  private final HybridData mHybridData;

  private static volatile boolean sIsSoLibraryLoaded;

  protected abstract HybridData initHybrid();

  protected NativeModulePerfLogger() {
    maybeLoadOtherSoLibraries();
    maybeLoadSoLibrary();
    mHybridData = initHybrid();
  }

  public abstract void moduleDataCreateStart(String moduleName, int id);

  public abstract void moduleDataCreateEnd(String moduleName, int id);

  public abstract void moduleCreateStart(String moduleName, int id);

  public abstract void moduleCreateCacheHit(String moduleName, int id);

  public abstract void moduleCreateConstructStart(String moduleName, int id);

  public abstract void moduleCreateConstructEnd(String moduleName, int id);

  public abstract void moduleCreateSetUpStart(String moduleName, int id);

  public abstract void moduleCreateSetUpEnd(String moduleName, int id);

  public abstract void moduleCreateEnd(String moduleName, int id);

  public abstract void moduleCreateFail(String moduleName, int id);

  // Prevents issues with initializer interruptions. See T38996825 and D13793825 for more context.
  private static synchronized void maybeLoadSoLibrary() {
    if (!sIsSoLibraryLoaded) {
      SoLoader.loadLibrary("reactperfloggerjni");
      sIsSoLibraryLoaded = true;
    }
  }

  /** Subclasses will override this method to load their own SO libraries. */
  protected synchronized void maybeLoadOtherSoLibraries() {}
}
