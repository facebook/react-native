/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.i18nmanager

import com.facebook.fbreact.specs.NativeI18nManagerSpec
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule

/** [NativeModule] that allows JS to set allowRTL and get isRTL status. */
@ReactModule(name = NativeI18nManagerSpec.NAME)
public class I18nManagerModule(context: ReactApplicationContext?) : NativeI18nManagerSpec(context) {
  public override fun getTypedExportedConstants(): Map<String, Any> {
    val context = getReactApplicationContext()
    val locale = context.resources.configuration.locales[0]

    return mapOf(
        "isRTL" to I18nUtil.instance.isRTL(context),
        "doLeftAndRightSwapInRTL" to I18nUtil.instance.doLeftAndRightSwapInRTL(context),
        "localeIdentifier" to locale.toString())
  }

  override fun allowRTL(value: Boolean) {
    I18nUtil.instance.allowRTL(getReactApplicationContext(), value)
  }

  override fun forceRTL(value: Boolean) {
    I18nUtil.instance.forceRTL(getReactApplicationContext(), value)
  }

  override fun swapLeftAndRightInRTL(value: Boolean) {
    I18nUtil.instance.swapLeftAndRightInRTL(getReactApplicationContext(), value)
  }

  public companion object {
    public const val NAME: String = NativeI18nManagerSpec.NAME
  }
}
