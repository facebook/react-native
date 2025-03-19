/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.testutils.shadows

import com.facebook.soloader.nativeloader.NativeLoader
import kotlin.jvm.JvmStatic
import org.robolectric.annotation.Implementation
import org.robolectric.annotation.Implements

@Suppress("UNUSED_PARAMETER")
@Implements(NativeLoader::class)
class ShadowNativeLoader {
  companion object {
    @JvmStatic @Implementation fun loadLibrary(shortName: String?): Boolean = true
  }
}
