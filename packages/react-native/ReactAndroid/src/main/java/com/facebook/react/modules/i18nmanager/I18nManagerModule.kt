/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.i18nmanager

import androidx.core.os.ConfigurationCompat
import com.facebook.fbreact.specs.NativeI18nManagerSpec
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.runtime.BridgelessReactContext
import java.util.Locale

/** [com.facebook.react.bridge.NativeModule] that allows JS to set forceRTL and get isRTL status. */
@ReactModule(name = NativeI18nManagerSpec.NAME)
internal class I18nManagerModule(context: ReactApplicationContext?) :
    NativeI18nManagerSpec(context) {
  override fun getTypedExportedConstants(): Map<String, Any> {
    val context = reactApplicationContext
    val locale =
        ConfigurationCompat.getLocales(context.resources.configuration)[0] ?: Locale.getDefault()

    return mapOf(
        "isRTL" to I18nUtil.instance.isRTL(context),
        "localeIdentifier" to locale.toString(),
    )
  }

  override fun forceRTL(value: Boolean, promise: Promise) {
    val wasRTL = I18nUtil.instance.isRTL(reactApplicationContext)
    I18nUtil.instance.forceRTL(value)
    relayoutIfNeeded(wasRTL, promise)
  }

  private fun relayoutIfNeeded(wasRTL: Boolean, promise: Promise) {
    if (I18nUtil.instance.isRTL(reactApplicationContext) == wasRTL) {
      promise.resolve(null)
      return
    }

    UiThreadUtil.runOnUiThread {
      (reactApplicationContext as? BridgelessReactContext)
          ?.updateLayoutDirectionOfAttachedSurfaces()
      promise.resolve(null)
    }
  }

  companion object {
    const val NAME: String = NativeI18nManagerSpec.NAME
  }
}
