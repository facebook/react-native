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
  interface NativeMethod {
    void invoke(CatalystInstance catalystInstance, ReadableNativeArray parameters);
    String getType();
  }

  /**
   * @return the name of this module. This will be the name used to {@code require()} this module
   * from javascript.
   */
  String getName();

  /**
   * @return methods callable from JS on this module
   */
  Map<String, NativeMethod> getMethods();

  /**
   * Append a field which represents the constants this module exports
   * to JS.  If no constants are exported this should do nothing.
   */
  void writeConstantsField(JsonGenerator jg, String fieldName) throws IOException;

  /**
   * This is called at the end of {@link CatalystApplicationFragment#createCatalystInstance()}
   * after the CatalystInstance has been created, in order to initialize NativeModules that require
   * the CatalystInstance or JS modules.
   */
  void initialize();

  /**
   * Return true if you intend to override some other native module that was registered e.g. as part
   * of a different package (such as the core one). Trying to override without returning true from
   * this method is considered an error and will throw an exception during initialization. By
   * default all modules return false.
   */
  boolean canOverrideExistingModule();

  /**
   * Called before {CatalystInstance#onHostDestroy}
   */
  void onCatalystInstanceDestroy();
}
