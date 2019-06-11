/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
package com.facebook.hermes.reactexecutor;

import com.facebook.hermes.instrumentation.HermesMemoryDumper;
import com.facebook.jni.HybridData;
import com.facebook.react.bridge.JavaScriptExecutor;
import com.facebook.soloader.SoLoader;
import java.util.concurrent.ScheduledExecutorService;
import javax.annotation.Nullable;

public class HermesExecutor extends JavaScriptExecutor {
  static {
    SoLoader.loadLibrary("hermes-executor");
  }

  HermesExecutor(@Nullable RuntimeConfig config) {
    super(
        config == null
            ? initHybridDefaultConfig()
            : initHybrid(
                config.heapSizeMB,
                config.es6Symbol,
                config.bytecodeWarmupPercent,
                config.tripWireEnabled,
                config.heapDumper,
                config.tripWireCooldownMS,
                config.tripWireLimitBytes));
  }

  @Override
  public String getName() {
    return "HermesExecutor";
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

  private static native HybridData initHybrid(
      long heapSizeMB,
      boolean es6Symbol,
      int bytecodeWarmupPercent,
      boolean tripWireEnabled,
      @Nullable HermesMemoryDumper heapDumper,
      long tripWireCooldownMS,
      long tripWireLimitBytes);
}
