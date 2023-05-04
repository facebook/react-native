/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import androidx.annotation.Nullable;
import java.util.Map;

/**
 * Base class for Catalyst native modules whose implementations are written in Java. Default
 * implementations for {@link #initialize} and {@link #onCatalystInstanceDestroy} are provided for
 * convenience. Subclasses which override these don't need to call {@code super} in case of
 * overriding those methods as implementation of those methods is empty.
 *
 * <p>BaseJavaModules can be linked to Fragments' lifecycle events, {@link CatalystInstance}
 * creation and destruction, by being called on the appropriate method when a life cycle event
 * occurs.
 *
 * <p>Native methods can be exposed to JS with {@link ReactMethod} annotation. Those methods may
 * only use limited number of types for their arguments:
 *
 * <ol>
 *   <li>primitives (boolean, int, float, double
 *   <li>{@link String} mapped from JS string
 *   <li>{@link ReadableArray} mapped from JS Array
 *   <li>{@link ReadableMap} mapped from JS Object
 *   <li>{@link Callback} mapped from js function and can be used only as a last parameter or in the
 *       case when it express success & error callback pair as two last arguments respectively.
 * </ol>
 *
 * <p>All methods exposed as native to JS with {@link ReactMethod} annotation must return {@code
 * void}.
 *
 * <p>Please note that it is not allowed to have multiple methods annotated with {@link ReactMethod}
 * with the same name.
 */
public abstract class BaseJavaModule implements NativeModule {
  // taken from Libraries/Utilities/MessageQueue.js
  public static final String METHOD_TYPE_ASYNC = "async";
  public static final String METHOD_TYPE_PROMISE = "promise";
  public static final String METHOD_TYPE_SYNC = "sync";

  /** @return a map of constants this module exports to JS. Supports JSON types. */
  public @Nullable Map<String, Object> getConstants() {
    return null;
  }

  @Override
  public void initialize() {
    // do nothing
  }

  @Override
  public boolean canOverrideExistingModule() {
    return false;
  }

  @Override
  public void onCatalystInstanceDestroy() {}

  /**
   * The CatalystInstance is going away with Venice. Therefore, the TurboModule infra introduces the
   * invalidate() method to allow NativeModules to clean up after themselves.
   */
  @Override
  public void invalidate() {
    onCatalystInstanceDestroy();
  }
}
