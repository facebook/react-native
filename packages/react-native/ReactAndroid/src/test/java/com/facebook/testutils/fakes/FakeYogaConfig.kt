/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.testutils.fakes

import com.facebook.yoga.YogaConfig
import com.facebook.yoga.YogaErrata
import com.facebook.yoga.YogaExperimentalFeature
import com.facebook.yoga.YogaLogger

/** A fake [YogaConfig] that allows us to test Yoga without using the real JNI. */
class FakeYogaConfig : YogaConfig() {
  var fakeErrata: YogaErrata? = YogaErrata.NONE
  var fakeLogger: YogaLogger? = YogaLogger { _, _ ->
    // no-op
  }

  override fun setExperimentalFeatureEnabled(feature: YogaExperimentalFeature?, enabled: Boolean) {
    // no-op
  }

  override fun setUseWebDefaults(useWebDefaults: Boolean) {
    // no-op
  }

  override fun setPointScaleFactor(pixelsInPoint: Float) {
    // no-op
  }

  override fun setErrata(errata: YogaErrata?) {
    fakeErrata = errata
  }

  override fun getErrata(): YogaErrata? {
    return fakeErrata
  }

  override fun setLogger(logger: YogaLogger?) {
    fakeLogger = logger
  }

  override fun getLogger(): YogaLogger? {
    return fakeLogger
  }

  override fun getNativePointer(): Long {
    return 0L
  }
}
