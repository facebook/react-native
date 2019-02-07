/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import javax.annotation.Nonnull;

/**
 * Interface for a mutable array. Used to pass arguments from Java to JS.
 */
public interface WritableArray extends ReadableArray {

  void pushNull();
  void pushBoolean(boolean value);
  void pushDouble(double value);
  void pushInt(int value);
  void pushString(@Nonnull String value);
  void pushArray(@Nonnull WritableArray array);
  void pushMap(@Nonnull WritableMap map);
}
