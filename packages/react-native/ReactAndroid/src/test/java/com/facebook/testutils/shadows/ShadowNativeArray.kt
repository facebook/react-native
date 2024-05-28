/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.testutils.shadows

import com.facebook.react.bridge.NativeArray
import com.facebook.react.bridge.ReadableNativeArray
import com.facebook.react.bridge.WritableNativeArray
import org.robolectric.annotation.Implements
import org.robolectric.shadow.api.Shadow

// Mockito can't mock native methods, so shadow the entire class instead
@Implements(NativeArray::class)
public open class ShadowNativeArray {
  public var contents: List<Any?> = mutableListOf()

  @Implements(ReadableNativeArray::class) public class Readable : ShadowNativeArray() {}

  @Implements(WritableNativeArray::class) public class Writable : ShadowNativeArray() {}

  public companion object {
    public fun getContents(array: NativeArray): List<Any?> =
        (Shadow.extract(array) as ShadowNativeArray).contents
  }
}
