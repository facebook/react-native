/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import android.content.Context
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.SurfaceDelegateFactory
import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener
import com.facebook.react.devsupport.interfaces.DevLoadingViewManager
import com.facebook.react.devsupport.interfaces.DevSplitBundleCallback
import com.facebook.react.devsupport.interfaces.PausedInDebuggerOverlayManager
import com.facebook.react.devsupport.interfaces.RedBoxHandler
import com.facebook.react.packagerconnection.RequestHandler

/**
 * An implementation of [com.facebook.react.devsupport.interfaces.DevSupportManager] that extends
 * the functionality in [DevSupportManagerBase] with some additional, more flexible APIs for
 * asynchronously loading the JS bundle.
 */
internal class BridgelessDevSupportManager : DevSupportManagerBase {

  constructor(
      context: Context,
      reactInstanceManagerHelper: ReactInstanceDevHelper,
      packagerPathForJSBundleName: String?
  ) : this(
      context.applicationContext,
      reactInstanceManagerHelper,
      packagerPathForJSBundleName,
      enableOnCreate = true,
      redBoxHandler = null,
      devBundleDownloadListener = null,
      minNumShakes = 2,
      customPackagerCommandHandlers = null,
      surfaceDelegateFactory = null,
      devLoadingViewManager = null,
      pausedInDebuggerOverlayManager = null)

  /**
   * This constructor mirrors the same constructor we have for [BridgeDevSupportManager] and is kept
   * for backward compatibility.
   */
  constructor(
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
  ) : super(
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

  override fun getUniqueTag(): String = "Bridgeless"

  override fun loadSplitBundleFromServer(bundlePath: String, callback: DevSplitBundleCallback) {
    fetchSplitBundleAndCreateBundleLoader(
        bundlePath,
        object : CallbackWithBundleLoader {
          override fun onSuccess(bundleLoader: JSBundleLoader) {
            try {
              mReactInstanceDevHelper.loadBundle(bundleLoader).waitForCompletion()
              val bundleURL = devServerHelper.getDevServerSplitBundleURL(bundlePath)
              mReactInstanceDevHelper.currentReactContext?.apply {
                getJSModule(HMRClient::class.java).registerBundle(bundleURL)
              }
              callback.onSuccess()
            } catch (e: InterruptedException) {
              Thread.currentThread().interrupt()
              throw RuntimeException(
                  "[BridgelessDevSupportManager]: Got interrupted while loading bundle", e)
            }
          }

          override fun onError(url: String, cause: Throwable) {
            callback.onError(url, cause)
          }
        })
  }

  override fun handleReloadJS() {
    UiThreadUtil.assertOnUiThread()

    // Dismiss redbox if exists
    hideRedboxDialog()
    mReactInstanceDevHelper.reload("BridgelessDevSupportManager.handleReloadJS()")
  }

  // Explicitly overriding to resolve JVM signature clash with getter generated for
  // `DevSupportManager.jSBundleURLForRemoteDebugging`
  @Suppress("ACCIDENTAL_OVERRIDE")
  override fun getJSBundleURLForRemoteDebugging(): String? =
      super.getJSBundleURLForRemoteDebugging()
}
