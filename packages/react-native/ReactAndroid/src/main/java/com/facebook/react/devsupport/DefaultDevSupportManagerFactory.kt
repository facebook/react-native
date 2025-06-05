/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import android.content.Context
import com.facebook.react.common.SurfaceDelegateFactory
import com.facebook.react.common.build.ReactBuildConfig
import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener
import com.facebook.react.devsupport.interfaces.DevLoadingViewManager
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.devsupport.interfaces.PausedInDebuggerOverlayManager
import com.facebook.react.devsupport.interfaces.RedBoxHandler
import com.facebook.react.packagerconnection.RequestHandler
import com.facebook.redex.annotations.IgnoreStringLiterals

/**
 * A simple factory that creates instances of [DevSupportManager] implementations. Uses reflection
 * to create BridgeDevSupportManager if it exists. This allows ProGuard to strip that class and its
 * dependencies in release builds. If the class isn't found, [PerftestDevSupportManager] is returned
 * instead.
 */
@IgnoreStringLiterals
internal class DefaultDevSupportManagerFactory : DevSupportManagerFactory {

  override fun create(
      applicationContext: Context,
      reactInstanceManagerHelper: ReactInstanceDevHelper,
      packagerPathForJSBundleName: String?,
      enableOnCreate: Boolean,
      redBoxHandler: RedBoxHandler?,
      devBundleDownloadListener: DevBundleDownloadListener?,
      minNumShakes: Int,
      customPackagerCommandHandlers: Map<String, RequestHandler>?,
      surfaceDelegateFactory: SurfaceDelegateFactory?,
      devLoadingViewManager: DevLoadingViewManager?,
      pausedInDebuggerOverlayManager: PausedInDebuggerOverlayManager?
  ): DevSupportManager {
    return if (!enableOnCreate) {
      ReleaseDevSupportManager()
    } else
        try {
          // Developer support is enabled, we now must choose whether to return a DevSupportManager,
          // or a more lean profiling-only PerftestDevSupportManager. We make the choice by first
          // trying to return the full support DevSupportManager and if it fails, then just
          // return PerftestDevSupportManager.

          // @IgnoreStringLiterals annotation is used to enable ProGuard to strip out the
          // BridgeDevSupportManager class
          val className = "com.facebook.react.devsupport.BridgeDevSupportManager"
          val devSupportManagerClass = Class.forName(className)
          val constructor =
              devSupportManagerClass.getConstructor(
                  Context::class.java,
                  ReactInstanceDevHelper::class.java,
                  String::class.java,
                  Boolean::class.javaPrimitiveType,
                  RedBoxHandler::class.java,
                  DevBundleDownloadListener::class.java,
                  Int::class.javaPrimitiveType,
                  MutableMap::class.java,
                  SurfaceDelegateFactory::class.java,
                  DevLoadingViewManager::class.java,
                  PausedInDebuggerOverlayManager::class.java)
          constructor.newInstance(
              applicationContext,
              reactInstanceManagerHelper,
              packagerPathForJSBundleName,
              true,
              redBoxHandler,
              devBundleDownloadListener,
              minNumShakes,
              customPackagerCommandHandlers,
              surfaceDelegateFactory,
              devLoadingViewManager,
              pausedInDebuggerOverlayManager) as DevSupportManager
        } catch (e: Exception) {
          PerftestDevSupportManager(applicationContext)
        }
  }

  override fun create(
      applicationContext: Context,
      reactInstanceManagerHelper: ReactInstanceDevHelper,
      packagerPathForJSBundleName: String?,
      enableOnCreate: Boolean,
      redBoxHandler: RedBoxHandler?,
      devBundleDownloadListener: DevBundleDownloadListener?,
      minNumShakes: Int,
      customPackagerCommandHandlers: Map<String, RequestHandler>?,
      surfaceDelegateFactory: SurfaceDelegateFactory?,
      devLoadingViewManager: DevLoadingViewManager?,
      pausedInDebuggerOverlayManager: PausedInDebuggerOverlayManager?,
      useDevSupport: Boolean
  ): DevSupportManager =
      if (ReactBuildConfig.UNSTABLE_ENABLE_FUSEBOX_RELEASE) {
        PerftestDevSupportManager(applicationContext)
      } else if (useDevSupport) {
        BridgelessDevSupportManager(
            applicationContext,
            reactInstanceManagerHelper,
            packagerPathForJSBundleName,
            enableOnCreate,
            redBoxHandler,
            devBundleDownloadListener,
            minNumShakes,
            customPackagerCommandHandlers,
            surfaceDelegateFactory,
            devLoadingViewManager,
            pausedInDebuggerOverlayManager)
      } else {
        ReleaseDevSupportManager()
      }
}
