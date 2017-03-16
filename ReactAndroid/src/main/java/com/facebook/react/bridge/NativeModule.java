/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

import java.util.Map;

/**
 * A native module whose API can be provided to JS catalyst instances.  {@link NativeModule}s whose
 * implementation is written in Java should extend {@link BaseJavaModule} or {@link
 * ReactContextBaseJavaModule}.  {@link NativeModule}s whose implementation is written in C++
 * must not provide any Java code (so they can be reused on other platforms), and instead should
 * register themselves using {@link CxxModuleWrapper}.
 */
public interface NativeModule {
  interface NativeMethod {
    void invoke(JSInstance jsInstance, ExecutorToken executorToken, ReadableNativeArray parameters);
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

  /**
   * In order to support web workers, a module must be aware that it can be invoked from multiple
   * different JS VMs. Supporting web workers means recognizing things like:
   *
   * 1) ids (e.g. timer ids, request ids, etc.) may only unique on a per-VM basis
   * 2) the module needs to make sure to enqueue callbacks and JS module calls to the correct VM
   *
   * In order to facilitate this, modules that support web workers will have all their @ReactMethod-
   * annotated methods passed a {@link ExecutorToken} as the first parameter before any arguments
   * from JS. This ExecutorToken internally maps to a specific JS VM and can be used by the
   * framework to route calls appropriately. In order to make JS module calls correctly, start using
   * the version of {@link ReactContext#getJSModule(ExecutorToken, Class)} that takes an
   * ExecutorToken. It will ensure that any calls you dispatch to the returned object will go to
   * the right VM. For Callbacks, you don't have to do anything special -- the framework
   * automatically tags them with the correct ExecutorToken when the are created.
   *
   * Note: even though calls can come from multiple JS VMs on multiple threads, calls to this module
   * will still only occur on a single thread.
   *
   * @return whether this module supports web workers.
   */
  boolean supportsWebWorkers();
}
