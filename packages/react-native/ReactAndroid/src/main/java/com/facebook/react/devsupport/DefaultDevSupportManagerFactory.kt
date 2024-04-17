/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import android.content.Context
import com.facebook.react.common.SurfaceDelegateFactory
import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener
import com.facebook.react.devsupport.interfaces.DevLoadingViewManager
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.devsupport.interfaces.PausedInDebuggerOverlayManager
import com.facebook.react.devsupport.interfaces.RedBoxHandler
import com.facebook.react.packagerconnection.RequestHandler

/**
 * A simple factory that creates instances of [DevSupportManager] implementations. Uses reflection
 * to create BridgeDevSupportManager if it exists. This allows ProGuard to strip that class and its
 * dependencies in release builds. If the class isn't found, [ ] is returned instead.
 */
public class DefaultDevSupportManagerFactory : DevSupportManagerFactory {

  @Deprecated(
      "in favor of the customisable create for DevSupportManagerFactory",
      ReplaceWith(
          "create(applicationContext, reactInstanceManagerHelper, packagerPathForJSBundleName, enableOnCreate, redBoxHandler, devBundleDownloadListener, minNumShakes, customPackagerCommandHandlers, surfaceDelegateFactory, devLoadingViewManager, pausedInDebuggerOverlayManager)"))
  public fun create(
      applicationContext: Context,
      reactInstanceDevHelper: ReactInstanceDevHelper,
      packagerPathForJSBundleName: String?,
      enableOnCreate: Boolean,
      minNumShakes: Int
  ): DevSupportManager {
    return create(
        applicationContext,
        reactInstanceDevHelper,
        packagerPathForJSBundleName,
        enableOnCreate,
        null,
        null,
        minNumShakes,
        null,
        null,
        null,
        null)
  }

  public override fun create(
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

          // ProGuard is surprisingly smart in this case and will keep a class if it detects a call
          // to
          // Class.forName() with a static string. So instead we generate a quasi-dynamic string to
          // confuse it.
          val className =
              StringBuilder(DEVSUPPORT_IMPL_PACKAGE)
                  .append(".")
                  .append(DEVSUPPORT_IMPL_CLASS)
                  .toString()
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

  private companion object {
    private const val DEVSUPPORT_IMPL_PACKAGE = "com.facebook.react.devsupport"
    private const val DEVSUPPORT_IMPL_CLASS = "BridgeDevSupportManager"
  }
}
