/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.testutils.shadows

import com.facebook.react.uimanager.ReactYogaConfigProvider
import com.facebook.testutils.fakes.FakeYogaConfig
import com.facebook.yoga.YogaConfig
import org.robolectric.annotation.Implementation
import org.robolectric.annotation.Implements

@Suppress("UNUSED_PARAMETER")
@Implements(ReactYogaConfigProvider::class)
class ShadowYogaConfigProvider {
  companion object {
    @JvmStatic @Implementation fun get(): YogaConfig = FakeYogaConfig()
  }
}
