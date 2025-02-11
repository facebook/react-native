/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime

import android.app.Activity
import android.os.Bundle
import android.view.View
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.bridge.JavaScriptExecutorFactory
import com.facebook.react.bridge.ReactContext
import com.facebook.react.devsupport.ReactInstanceDevHelper
import com.facebook.react.interfaces.TaskInterface
import com.facebook.react.modules.core.DeviceEventManagerModule

/**
 * Implementation of [ReactInstanceDevHelper] for [ReactHostImpl].
 *
 * This allows [BridgelessDevSupportHelper] and other classes inside the .devsupport package to
 * communicate with the Bridgeless infrastructure without exposing public APIs.
 */
internal class ReactHostImplDevHelper(private val delegate: ReactHostImpl) :
    ReactInstanceDevHelper {

  override fun onJSBundleLoadedFromServer() {
    // Not implemented, only referenced by BridgeDevSupportManager
  }

  override fun toggleElementInspector() {
    val reactContext = delegate.currentReactContext
    reactContext
        ?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        ?.emit("toggleElementInspector", null)
  }

  override fun getCurrentActivity(): Activity? = delegate.lastUsedActivity

  override fun getJavaScriptExecutorFactory(): JavaScriptExecutorFactory {
    throw IllegalStateException("Not implemented for bridgeless mode")
  }

  override fun createRootView(appKey: String): View? {
    val currentActivity = currentActivity
    if (currentActivity != null && !delegate.isSurfaceWithModuleNameAttached(appKey)) {
      val reactSurface = ReactSurfaceImpl.createWithView(currentActivity, appKey, Bundle())
      reactSurface.attach(delegate)
      reactSurface.start()

      return reactSurface.view
    }
    return null
  }

  override fun destroyRootView(rootView: View) {
    // Not implemented, only referenced by BridgeDevSupportManager
  }

  override fun reload(s: String) {
    delegate.reload(s)
  }

  override fun loadBundle(bundleLoader: JSBundleLoader): TaskInterface<Boolean> =
      delegate.loadBundle(bundleLoader)

  override fun getCurrentReactContext(): ReactContext? = delegate.currentReactContext
}
