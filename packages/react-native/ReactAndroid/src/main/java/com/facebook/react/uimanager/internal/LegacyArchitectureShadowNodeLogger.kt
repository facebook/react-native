/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.internal

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactNoCrashSoftException
import com.facebook.react.bridge.ReactSoftExceptionLogger
import com.facebook.react.common.annotations.LegacyArchitectureShadowNodeWithCxxImpl
import com.facebook.react.common.build.ReactBuildConfig
import com.facebook.react.util.RNLog
import com.facebook.yoga.YogaMeasureFunction

/**
 * Logger class to track usage of ShadowNodes in Legacy Architecture.
 *
 * This class is similar to
 * [com.facebook.react.common.annotations.internal.LegacyArchitectureLogger] but focuses only on
 * ShadowNodes warning for users.
 */
public object LegacyArchitectureShadowNodeLogger {

  @JvmStatic
  public fun assertUnsupportedViewManager(
      reactContext: ReactApplicationContext,
      shadowNodeClass: Class<*>,
      viewManagerName: String,
  ) {
    val implementsYogaMeasureFunction =
        YogaMeasureFunction::class.java in shadowNodeClass.interfaces
    val annotatedWithCxxImpl =
        shadowNodeClass.isAnnotationPresent(LegacyArchitectureShadowNodeWithCxxImpl::class.java)
    if (implementsYogaMeasureFunction && !annotatedWithCxxImpl) {
      val message =
          """
          [Legacy Architecture] The ViewManager `$viewManagerName` is unlikely to work with the New Architecture.
          That's because the shadow node `${shadowNodeClass.simpleName}` implements the `YogaMeasureFunction.measure()` method.
          This is not supported in the New Architecture as shadow nodes with custom measurements should be implemented in C++.
          """
              .trimIndent()

      if (ReactBuildConfig.DEBUG) {
        RNLog.w(reactContext, message)
        ReactSoftExceptionLogger.logSoftException(
            ReactSoftExceptionLogger.Categories.SOFT_ASSERTIONS,
            ReactNoCrashSoftException(message),
        )
      }
    }
  }
}
