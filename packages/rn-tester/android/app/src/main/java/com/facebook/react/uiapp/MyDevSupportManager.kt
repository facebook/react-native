/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uiapp

import android.app.Activity
import android.util.Pair
import android.view.View
import com.facebook.react.ReactHost
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.common.SurfaceDelegate
import com.facebook.react.devsupport.interfaces.BundleLoadCallback
import com.facebook.react.devsupport.interfaces.DevOptionHandler
import com.facebook.react.devsupport.interfaces.DevSplitBundleCallback
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.devsupport.interfaces.ErrorCustomizer
import com.facebook.react.devsupport.interfaces.ErrorType
import com.facebook.react.devsupport.interfaces.PackagerStatusCallback
import com.facebook.react.devsupport.interfaces.RedBoxHandler
import com.facebook.react.devsupport.interfaces.StackFrame
import com.facebook.react.modules.debug.interfaces.DeveloperSettings
import java.io.File

public class MyDevSupportManager(reactHost: ReactHost) : DevSupportManager {

  override val devSettings: DeveloperSettings
    get() = TODO("Not yet implemented")

  override val redBoxHandler: RedBoxHandler
    get() = TODO("Not yet implemented")

  override val sourceMapUrl: String
    get() = TODO("Not yet implemented")

  override val sourceUrl: String
    get() = TODO("Not yet implemented")

  override val jSBundleURLForRemoteDebugging: String
    get() = TODO("Not yet implemented")

  override val downloadedJSBundleFile: String
    get() = TODO("Not yet implemented")

  override val lastErrorTitle: String
    get() = TODO("Not yet implemented")

  override val lastErrorStack: Array<StackFrame>
    get() = TODO("Not yet implemented")

  override val lastErrorType: ErrorType
    get() = TODO("Not yet implemented")

  override val lastErrorCookie: Int
    get() = TODO("Not yet implemented")

  override val currentActivity: Activity
    get() = TODO("Not yet implemented")

  override var devSupportEnabled: Boolean
    get() = TODO("Not yet implemented")
    set(value) = Unit

  override fun showNewJavaError(message: String?, e: Throwable?) {
    TODO("Not yet implemented")
  }

  override fun addCustomDevOption(optionName: String?, optionHandler: DevOptionHandler?) {
    TODO("Not yet implemented")
  }

  override fun createRootView(appKey: String?): View? {
    TODO("Not yet implemented")
  }

  override fun destroyRootView(rootView: View?) {
    TODO("Not yet implemented")
  }

  override fun showNewJSError(message: String?, details: ReadableArray?, errorCookie: Int) {
    TODO("Not yet implemented")
  }

  override fun updateJSError(message: String?, details: ReadableArray?, errorCookie: Int) {
    TODO("Not yet implemented")
  }

  override fun hideRedboxDialog() {
    TODO("Not yet implemented")
  }

  override fun showDevOptionsDialog() {
    TODO("Not yet implemented")
  }

  override fun startInspector() {
    TODO("Not yet implemented")
  }

  override fun stopInspector() {
    TODO("Not yet implemented")
  }

  override fun onNewReactContextCreated(reactContext: ReactContext) {
    TODO("Not yet implemented")
  }

  override fun onReactInstanceDestroyed(reactContext: ReactContext) {
    TODO("Not yet implemented")
  }

  override fun hasUpToDateJSBundleInCache(): Boolean {
    TODO("Not yet implemented")
  }

  override fun reloadSettings() {
    TODO("Not yet implemented")
  }

  override fun handleReloadJS() {
    TODO("Not yet implemented")
  }

  override fun reloadJSFromServer(bundleURL: String, callback: BundleLoadCallback) {
    TODO("Not yet implemented")
  }

  override fun loadSplitBundleFromServer(bundlePath: String, callback: DevSplitBundleCallback) {
    TODO("Not yet implemented")
  }

  override fun isPackagerRunning(callback: PackagerStatusCallback) {
    TODO("Not yet implemented")
  }

  override fun setHotModuleReplacementEnabled(isHotModuleReplacementEnabled: Boolean) {
    TODO("Not yet implemented")
  }

  override fun setRemoteJSDebugEnabled(isRemoteJSDebugEnabled: Boolean) {
    TODO("Not yet implemented")
  }

  override fun setFpsDebugEnabled(isFpsDebugEnabled: Boolean) {
    TODO("Not yet implemented")
  }

  override fun toggleElementInspector() {
    TODO("Not yet implemented")
  }

  override fun downloadBundleResourceFromUrlSync(resourceURL: String, outputFile: File?): File? {
    TODO("Not yet implemented")
  }

  override fun registerErrorCustomizer(errorCustomizer: ErrorCustomizer?) {
    TODO("Not yet implemented")
  }

  override fun processErrorCustomizers(
      errorInfo: Pair<String, Array<StackFrame>>?
  ): Pair<String, Array<StackFrame>>? {
    TODO("Not yet implemented")
  }

  override fun setPackagerLocationCustomizer(
      packagerLocationCustomizer: DevSupportManager.PackagerLocationCustomizer?
  ) {
    TODO("Not yet implemented")
  }

  override fun createSurfaceDelegate(moduleName: String?): SurfaceDelegate? {
    TODO("Not yet implemented")
  }

  override fun openDebugger() {
    TODO("Not yet implemented")
  }

  override fun showPausedInDebuggerOverlay(
      message: String,
      listener: DevSupportManager.PausedInDebuggerOverlayCommandListener
  ) {
    TODO("Not yet implemented")
  }

  override fun hidePausedInDebuggerOverlay() {
    TODO("Not yet implemented")
  }

  override fun setAdditionalOptionForPackager(name: String, value: String) {
    TODO("Not yet implemented")
  }

  override fun handleException(e: Exception) {
    TODO("Not yet implemented")
  }
}
