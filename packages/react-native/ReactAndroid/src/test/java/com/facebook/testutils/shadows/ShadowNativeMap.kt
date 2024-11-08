/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.testutils.shadows

import com.facebook.react.bridge.NativeMap
import com.facebook.react.bridge.ReadableNativeMap
import com.facebook.react.bridge.WritableNativeMap
import org.robolectric.annotation.Implements
import org.robolectric.shadow.api.Shadow

// Mockito can't mock native methods, so shadow the entire class instead
@Implements(NativeMap::class)
public open class ShadowNativeMap {
  public var contents: Map<String, Any?> = HashMap()

  @Implements(ReadableNativeMap::class) public class Readable : ShadowNativeMap() {}

  @Implements(WritableNativeMap::class) public class Writable : ShadowNativeMap() {}

  public companion object {
    public fun getContents(map: NativeMap): Map<String, Any?> =
        (Shadow.extract(map) as ShadowNativeMap).contents
  }
}
