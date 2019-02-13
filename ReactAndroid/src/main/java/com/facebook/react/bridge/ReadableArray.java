/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import java.util.ArrayList;

import javax.annotation.Nonnull;
import javax.annotation.Nullable;

/**
 * Interface for an array that allows typed access to its members. Used to pass parameters from JS
 * to Java.
 */
public interface ReadableArray {

  int size();
  boolean isNull(int index);
  boolean getBoolean(int index);
  double getDouble(int index);
  int getInt(int index);
  @Nullable String getString(int index);
  @Nullable ReadableArray getArray(int index);
  @Nullable ReadableMap getMap(int index);
  @Nonnull Dynamic getDynamic(int index);
  @Nonnull ReadableType getType(int index);
  @Nonnull ArrayList<Object> toArrayList();

}
