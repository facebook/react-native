/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.testutils.shadows

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.WritableMap
import org.robolectric.annotation.Implementation
import org.robolectric.annotation.Implements

@Implements(Arguments::class)
class ShadowArguments {
  companion object {
    @JvmStatic @Implementation fun createMap(): WritableMap = JavaOnlyMap()
  }
}
