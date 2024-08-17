/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.proguard.annotations.DoNotStrip

/** Defines the type of an object stored in a [ReadableArray] or [ReadableMap]. */
@DoNotStrip
public enum class ReadableType {
  Null,
  Boolean,
  Number,
  String,
  Map,
  Array,
}
