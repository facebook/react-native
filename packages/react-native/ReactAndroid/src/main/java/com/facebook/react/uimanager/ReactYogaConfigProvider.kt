/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import com.facebook.yoga.YogaConfig
import com.facebook.yoga.YogaConfigFactory
import com.facebook.yoga.YogaErrata

internal object ReactYogaConfigProvider {

  val yogaConfig: YogaConfig by
      lazy(LazyThreadSafetyMode.NONE) {
        YogaConfigFactory.create().apply {
          setPointScaleFactor(0f)
          setErrata(YogaErrata.ALL)
        }
      }
}
