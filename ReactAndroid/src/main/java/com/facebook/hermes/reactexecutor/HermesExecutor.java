/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.hermes.reactexecutor;

import com.facebook.jni.HybridData;
import com.facebook.react.bridge.JavaScriptExecutor;
import com.facebook.soloader.SoLoader;
import javax.annotation.Nullable;

public class HermesExecutor extends JavaScriptExecutor {
  private static String mode_;

  static {
    loadLibrary();
  }

  public static void loadLibrary() throws UnsatisfiedLinkError {
    if (mode_ == null) {
      // libhermes must be loaded explicitly to invoke its JNI_OnLoad.
      SoLoader.loadLibrary("hermes");
      try {
        SoLoader.loadLibrary("hermes-executor-debug");
        mode_ = "Debug";
      } catch (UnsatisfiedLinkError e) {
        SoLoader.loadLibrary("hermes-executor-release");
        mode_ = "Release";
      }
    }
  }

  HermesExecutor(@Nullable RuntimeConfig config) {
    super(config == null ? initHybridDefaultConfig() : initHybrid(config.heapSizeMB));
  }

  @Override
  public String getName() {
    return "HermesExecutor" + mode_;
  }

  /**
   * Return whether this class can load a file at the given path, based on a binary compatibility
   * check between the contents of the file and the Hermes VM.
   *
   * @param path the path containing the file to inspect.
   * @return whether the given file is compatible with the Hermes VM.
   */
  public static native boolean canLoadFile(String path);

  private static native HybridData initHybridDefaultConfig();

  private static native HybridData initHybrid(long heapSizeMB);
}
