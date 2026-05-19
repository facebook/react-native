/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import com.facebook.proguard.annotations.DoNotStrip

/** Interface of a iterator for a [NativeMap]'s key set. */
@DoNotStrip
public interface ReadableMapKeySetIterator {
  public fun hasNextKey(): Boolean

  public fun nextKey(): String
}
