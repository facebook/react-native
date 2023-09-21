/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime.internal.bolts;

import androidx.annotation.Nullable;

/**
 * Provides a class that can be used for capturing variables in an anonymous class implementation.
 *
 * @param <T>
 */
public class Capture<T> {
  private @Nullable T value;

  public Capture() {}

  public Capture(@Nullable T value) {
    this.value = value;
  }

  public @Nullable T get() {
    return value;
  }

  public void set(@Nullable T value) {
    this.value = value;
  }
}
