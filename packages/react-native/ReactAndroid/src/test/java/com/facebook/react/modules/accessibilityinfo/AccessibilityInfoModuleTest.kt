/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.accessibilityinfo

import android.content.res.Configuration
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test

class AccessibilityInfoModuleTest {
  @Test
  fun boldTextIsEnabledForAPositiveFontWeightAdjustment() {
    assertThat(AccessibilityInfoModule.isBoldTextEnabled(300)).isTrue()
  }

  @Test
  fun boldTextIsDisabledWithoutAFontWeightAdjustment() {
    assertThat(AccessibilityInfoModule.isBoldTextEnabled(0)).isFalse()
  }

  @Test
  fun boldTextIsDisabledForANegativeFontWeightAdjustment() {
    assertThat(AccessibilityInfoModule.isBoldTextEnabled(-100)).isFalse()
  }

  @Test
  fun boldTextIsDisabledWhenTheFontWeightAdjustmentIsUndefined() {
    assertThat(
            AccessibilityInfoModule.isBoldTextEnabled(
                Configuration.FONT_WEIGHT_ADJUSTMENT_UNDEFINED
            )
        )
        .isFalse()
  }
}
