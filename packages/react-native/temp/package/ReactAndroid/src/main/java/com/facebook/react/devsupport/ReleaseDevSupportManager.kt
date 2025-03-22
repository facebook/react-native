/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import android.app.Activity
import android.util.Pair
import android.view.View
import com.facebook.react.bridge.DefaultJSExceptionHandler
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.common.SurfaceDelegate
import com.facebook.react.devsupport.interfaces.BundleLoadCallback
import com.facebook.react.devsupport.interfaces.DevOptionHandler
import com.facebook.react.devsupport.interfaces.DevSplitBundleCallback
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.devsupport.interfaces.DevSupportManager.PackagerLocationCustomizer
import com.facebook.react.devsupport.interfaces.DevSupportManager.PausedInDebuggerOverlayCommandListener
import com.facebook.react.devsupport.interfaces.ErrorCustomizer
import com.facebook.react.devsupport.interfaces.ErrorType
import com.facebook.react.devsupport.interfaces.PackagerStatusCallback
import com.facebook.react.devsupport.interfaces.RedBoxHandler
import com.facebook.react.devsupport.interfaces.StackFrame
import com.facebook.react.modules.debug.interfaces.DeveloperSettings
import java.io.File

/**
 * A dummy implementation of [DevSupportManager] to be used in production mode where development
 * features aren't needed.
 */
public open class ReleaseDevSupportManager : DevSupportManager {

  private val defaultJSExceptionHandler: DefaultJSExceptionHandler = DefaultJSExceptionHandler()

  override public fun showNewJavaError(message: String?, e: Throwable?): Unit = Unit

  override public fun addCustomDevOption(
      optionName: String?,
      optionHandler: DevOptionHandler?
  ): Unit = Unit

  override public fun showNewJSError(
      message: String?,
      details: ReadableArray?,
      errorCookie: Int
  ): Unit = Unit

  override public fun createRootView(appKey: String?): View? = null

  override public fun destroyRootView(rootView: View?): Unit = Unit

  override public fun updateJSError(
      message: String?,
      details: ReadableArray?,
      errorCookie: Int
  ): Unit = Unit

  override public fun hideRedboxDialog(): Unit = Unit

  override public fun showDevOptionsDialog(): Unit = Unit

  override public fun startInspector(): Unit = Unit

  override public fun stopInspector(): Unit = Unit

  override public fun setHotModuleReplacementEnabled(isHotModuleReplacementEnabled: Boolean): Unit =
      Unit

  override public fun setRemoteJSDebugEnabled(isRemoteJSDebugEnabled: Boolean): Unit = Unit

  override public fun setFpsDebugEnabled(isFpsDebugEnabled: Boolean): Unit = Unit

  override public fun toggleElementInspector(): Unit = Unit

  override public var devSupportEnabled: Boolean
    get() = false
    @Suppress("UNUSED_PARAMETER") set(isDevSupportEnabled: Boolean): Unit = Unit

  override public val devSettings: DeveloperSettings?
    get() = null

  override public val redBoxHandler: RedBoxHandler?
    get() = null

  override public fun onNewReactContextCreated(reactContext: ReactContext): Unit = Unit

  override public fun onReactInstanceDestroyed(reactContext: ReactContext): Unit = Unit

  override public val sourceMapUrl: String?
    get() = null

  override public val sourceUrl: String?
    get() = null

  override public val jSBundleURLForRemoteDebugging: String?
    get() = null

  override public val downloadedJSBundleFile: String?
    get() = null

  override public fun hasUpToDateJSBundleInCache(): Boolean = false

  override public fun reloadSettings(): Unit = Unit

  override public fun handleReloadJS(): Unit = Unit

  override public fun reloadJSFromServer(bundleURL: String, callback: BundleLoadCallback): Unit =
      Unit

  override public fun loadSplitBundleFromServer(
      bundlePath: String,
      callback: DevSplitBundleCallback
  ): Unit = Unit

  override public fun isPackagerRunning(callback: PackagerStatusCallback) {
    callback.onPackagerStatusFetched(false)
  }

  override public fun downloadBundleResourceFromUrlSync(
      resourceURL: String,
      outputFile: File?
  ): File? = null

  override public val lastErrorTitle: String?
    get() = null

  override public val lastErrorStack: Array<StackFrame>?
    get() = null

  override public val lastErrorType: ErrorType?
    get() = null

  override public val lastErrorCookie: Int = 0

  override public fun registerErrorCustomizer(errorCustomizer: ErrorCustomizer?): Unit = Unit

  override public fun processErrorCustomizers(
      errorInfo: Pair<String, Array<StackFrame>>?
  ): Pair<String, Array<StackFrame>>? = errorInfo

  override public fun setPackagerLocationCustomizer(
      packagerLocationCustomizer: PackagerLocationCustomizer?
  ): Unit = Unit

  override public fun handleException(e: Exception) {
    defaultJSExceptionHandler.handleException(e)
  }

  override public val currentActivity: Activity?
    get() = null

  override public fun createSurfaceDelegate(moduleName: String?): SurfaceDelegate? = null

  override public fun openDebugger(): Unit = Unit

  override public fun showPausedInDebuggerOverlay(
      message: String,
      listener: PausedInDebuggerOverlayCommandListener
  ): Unit = Unit

  override public fun hidePausedInDebuggerOverlay(): Unit = Unit

  override public fun setAdditionalOptionForPackager(name: String, value: String): Unit = Unit
}
