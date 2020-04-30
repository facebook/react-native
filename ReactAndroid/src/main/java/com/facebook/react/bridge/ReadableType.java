/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge;

import com.facebook.proguard.annotations.DoNotStrip;

/** Defines the type of an object stored in a {@link ReadableArray} or {@link ReadableMap}. */
@DoNotStrip
public enum ReadableType {
  Null,
  Boolean,
  Number,
  String,
  Map,
  Array,
}
