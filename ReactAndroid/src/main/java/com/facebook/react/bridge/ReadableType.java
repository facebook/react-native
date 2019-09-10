/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * <p>This source code is licensed under the MIT license found in the LICENSE file in the root
 * directory of this source tree.
 */
package com.facebook.react.bridge;

import androidx.annotation.Keep;

/** Defines the type of an object stored in a {@link ReadableArray} or {@link ReadableMap}. */
@Keep
public enum ReadableType {
  Null,
  Boolean,
  Number,
  String,
  Map,
  Array,
}
