/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

package com.facebook.react.bridge;

import javax.annotation.Nullable;

import java.util.Map;

/**
 * Base class for Catalyst native modules whose implementations are written in Java. Default
 * implementations for {@link #initialize} and {@link #onCatalystInstanceDestroy} are provided for
 * convenience.  Subclasses which override these don't need to call {@code super} in case of
 * overriding those methods as implementation of those methods is empty.
 *
 * BaseJavaModules can be linked to Fragments' lifecycle events, {@link CatalystInstance} creation
 * and destruction, by being called on the appropriate method when a life cycle event occurs.
 *
 * Native methods can be exposed to JS with {@link ReactMethod} annotation. Those methods may
 * only use limited number of types for their arguments:
 * 1/ primitives (boolean, int, float, double
 * 2/ {@link String} mapped from JS string
 * 3/ {@link ReadableArray} mapped from JS Array
 * 4/ {@link ReadableMap} mapped from JS Object
 * 5/ {@link Callback} mapped from js function and can be used only as a last parameter or in the
 * case when it express success & error callback pair as two last arguments respecively.
 *
 * All methods exposed as native to JS with {@link ReactMethod} annotation must return
 * {@code void}.
 *
 * Please note that it is not allowed to have multiple methods annotated with {@link ReactMethod}
 * with the same name.
 */
public abstract class BaseJavaModule implements NativeModule {
  // taken from Libraries/Utilities/MessageQueue.js
  static final public String METHOD_TYPE_ASYNC = "async";
  static final public String METHOD_TYPE_PROMISE= "promise";
  static final public String METHOD_TYPE_SYNC = "sync";

  /**
   * @return a map of constants this module exports to JS. Supports JSON types.
   */
  public @Nullable Map<String, Object> getConstants() {
    return null;
  }

  @Override
  public void initialize() {
    // do nothing
  }

  @Override
  public boolean canOverrideExistingModule() {
    // TODO(t11394819): Make this final and use annotation
    return false;
  }

  @Override
  public void onCatalystInstanceDestroy() {
    // do nothing
  }

  @Override
  public boolean supportsWebWorkers() {
    return false;
  }

  public boolean hasConstants() {
    return false;
  }
}
