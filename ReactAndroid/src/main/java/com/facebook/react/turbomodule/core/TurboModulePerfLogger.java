/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.turbomodule.core;

import com.facebook.proguard.annotations.DoNotStrip;
import com.facebook.react.perflogger.NativeModulePerfLogger;
import com.facebook.soloader.SoLoader;
import javax.annotation.Nullable;

@DoNotStrip
public class TurboModulePerfLogger {
  @Nullable private static NativeModulePerfLogger sNativeModulePerfLogger = null;
  private static boolean sIsSoLibraryLoaded = false;

  public static void moduleDataCreateStart(String moduleName, int id) {
    if (sNativeModulePerfLogger != null) {
      sNativeModulePerfLogger.moduleDataCreateStart(moduleName, id);
    }
  }

  public static void moduleDataCreateEnd(String moduleName, int id) {
    if (sNativeModulePerfLogger != null) {
      sNativeModulePerfLogger.moduleDataCreateEnd(moduleName, id);
    }
  }

  public static void moduleCreateStart(String moduleName, int id) {
    if (sNativeModulePerfLogger != null) {
      sNativeModulePerfLogger.moduleCreateStart(moduleName, id);
    }
  }

  public static void moduleCreateCacheHit(String moduleName, int id) {
    if (sNativeModulePerfLogger != null) {
      sNativeModulePerfLogger.moduleCreateCacheHit(moduleName, id);
    }
  }

  public static void moduleCreateConstructStart(String moduleName, int id) {
    if (sNativeModulePerfLogger != null) {
      sNativeModulePerfLogger.moduleCreateConstructStart(moduleName, id);
    }
  }

  public static void moduleCreateConstructEnd(String moduleName, int id) {
    if (sNativeModulePerfLogger != null) {
      sNativeModulePerfLogger.moduleCreateConstructEnd(moduleName, id);
    }
  }

  public static void moduleCreateSetUpStart(String moduleName, int id) {
    if (sNativeModulePerfLogger != null) {
      sNativeModulePerfLogger.moduleCreateSetUpStart(moduleName, id);
    }
  }

  public static void moduleCreateSetUpEnd(String moduleName, int id) {
    if (sNativeModulePerfLogger != null) {
      sNativeModulePerfLogger.moduleCreateSetUpEnd(moduleName, id);
    }
  }

  public static void moduleCreateEnd(String moduleName, int id) {
    if (sNativeModulePerfLogger != null) {
      sNativeModulePerfLogger.moduleCreateEnd(moduleName, id);
    }
  }

  public static void moduleCreateFail(String moduleName, int id) {
    if (sNativeModulePerfLogger != null) {
      sNativeModulePerfLogger.moduleCreateFail(moduleName, id);
    }
  }

  private static native void jniEnableCppLogging(NativeModulePerfLogger perfLogger);

  private static synchronized void maybeLoadSoLibrary() {
    if (!sIsSoLibraryLoaded) {
      SoLoader.loadLibrary("turbomodulejsijni");
      sIsSoLibraryLoaded = true;
    }
  }

  public static void enableLogging(NativeModulePerfLogger perfLogger) {
    if (perfLogger != null) {
      sNativeModulePerfLogger = perfLogger;
      maybeLoadSoLibrary();
      jniEnableCppLogging(perfLogger);
    }
  }
}
