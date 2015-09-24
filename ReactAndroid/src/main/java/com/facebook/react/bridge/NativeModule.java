/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

import java.io.IOException;
import java.util.Map;

import com.fasterxml.jackson.core.JsonGenerator;

/**
 * A native module whose API can be provided to JS catalyst instances.  {@link NativeModule}s whose
 * implementation is written in Java should extend {@link BaseJavaModule} or {@link
 * ReactContextBaseJavaModule}.  {@link NativeModule}s whose implementation is written in C++
 * must not provide any Java code (so they can be reused on other platforms), and instead should
 * register themselves using {@link CxxModuleWrapper}.
 */
public interface NativeModule {
  public static interface NativeMethod {
    void invoke(CatalystInstance catalystInstance, ReadableNativeArray parameters);
  }

  /**
   * @return the name of this module. This will be the name used to {@code require()} this module
   * from javascript.
   */
  public String getName();

  /**
   * @return methods callable from JS on this module
   */
  public Map<String, NativeMethod> getMethods();

  /**
   * Append a field which represents the constants this module exports
   * to JS.  If no constants are exported this should do nothing.
   */
  public void writeConstantsField(JsonGenerator jg, String fieldName) throws IOException;

  /**
   * This is called at the end of {@link CatalystApplicationFragment#createCatalystInstance()}
   * after the CatalystInstance has been created, in order to initialize NativeModules that require
   * the CatalystInstance or JS modules.
   */
  public void initialize();

  /**
   * Called before {CatalystInstance#onHostDestroy}
   */
  public void onCatalystInstanceDestroy();
}
