/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.testutils.shadows

import com.facebook.testutils.fakes.FakeYogaNode
import com.facebook.yoga.YogaConfig
import com.facebook.yoga.YogaNode
import com.facebook.yoga.YogaNodeFactory
import org.robolectric.annotation.Implementation
import org.robolectric.annotation.Implements

@Suppress("UNUSED_PARAMETER")
@Implements(YogaNodeFactory::class)
class ShadowYogaNodeFactory {
  companion object {

    @JvmStatic @Implementation fun create(): YogaNode = FakeYogaNode()

    @JvmStatic @Implementation fun create(config: YogaConfig): YogaNode = FakeYogaNode()
  }
}
