/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import android.content.Context
import com.facebook.debug.holder.PrinterHolder.printer
import com.facebook.debug.tags.ReactDebugOverlayTags
import com.facebook.infer.annotation.Assertions
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.SurfaceDelegateFactory
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger.assertLegacyArchitecture
import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener
import com.facebook.react.devsupport.interfaces.DevLoadingViewManager
import com.facebook.react.devsupport.interfaces.PausedInDebuggerOverlayManager
import com.facebook.react.devsupport.interfaces.RedBoxHandler
import com.facebook.react.packagerconnection.RequestHandler

/**
 * Interface for accessing and interacting with development features. Following features are
 * supported through this manager class:
 * 1) Displaying JS errors (aka RedBox)
 * 2) Displaying developers menu (Reload JS, Debug JS)
 * 3) Communication with developer server in order to download updated JS bundle
 * 4) Starting/stopping broadcast receiver for js reload signals
 * 5) Starting/stopping motion sensor listener that recognize shake gestures which in turn may
 *    trigger developers menu.
 * 6) Launching developers settings view
 *
 * This class automatically monitors the state of registered views and activities to which they are
 * bound to make sure that we don't display overlay or that we we don't listen for sensor events
 * when app is backgrounded.
 *
 * [com.facebook.react.ReactInstanceManager] implementation is responsible for instantiating this
 * class as well as for populating with a reference to [com.facebook.react.bridge.CatalystInstance]
 * whenever instance manager recreates it (through [onNewReactContextCreated]). Also, instance
 * manager is responsible for enabling/disabling dev support in case when app is backgrounded or
 * when all the views has been detached from the instance (through `setDevSupportEnabled` method).
 */
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
public class BridgeDevSupportManager(
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
) :
    DevSupportManagerBase(
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
        pausedInDebuggerOverlayManager) {

  override val uniqueTag: String
    get() = "Bridge"

  override fun handleReloadJS() {
    UiThreadUtil.assertOnUiThread()
    ReactMarker.logMarker(
        ReactMarkerConstants.RELOAD, devSettings.packagerConnectionSettings.debugServerHost)

    // dismiss redbox if exists
    hideRedboxDialog()

    printer.logMessage(ReactDebugOverlayTags.RN_CORE, "RNCore: load from Server")
    val bundleURL = devServerHelper.getDevServerBundleURL(Assertions.assertNotNull(jsAppBundleName))
    reloadJSFromServer(bundleURL) {
      UiThreadUtil.runOnUiThread { reactInstanceDevHelper.onJSBundleLoadedFromServer() }
    }
  }

  private companion object {
    init {
      assertLegacyArchitecture("BridgeDevSupportManager", LegacyArchitectureLogLevel.ERROR)
    }
  }
}
