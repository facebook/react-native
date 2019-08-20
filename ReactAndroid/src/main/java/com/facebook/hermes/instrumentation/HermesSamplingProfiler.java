// Copyright 2004-present Facebook. All Rights Reserved.

package com.facebook.hermes.instrumentation;

import com.facebook.soloader.SoLoader;

/** Hermes sampling profiler static JSI API. */
public class HermesSamplingProfiler {
  static {
    SoLoader.loadLibrary("jsijniprofiler");
  }

  /** Start sample profiling. */
  public static native void enable();

  /** Stop sample profiling. */
  public static native void disable();

  /**
   * Dump sampled stack traces to file.
   *
   * @param filename the file to dump sampling trace to.
   */
  public static native void dumpSampledTraceToFile(String filename);

  private HermesSamplingProfiler() {}
}
