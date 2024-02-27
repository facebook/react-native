/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import android.content.Context
import com.facebook.common.logging.FLog
import com.facebook.infer.annotation.Assertions
import com.facebook.react.bridge.queue.ReactQueueConfiguration
import com.facebook.react.common.ReactConstants
import com.facebook.react.common.annotations.FrameworkAPI
import com.facebook.react.common.annotations.UnstableReactNativeAPI

class BridgeReactContext(base: Context) : ReactApplicationContext(base) {
  @Volatile private var destroyed = false
  private var catalystInstance: CatalystInstance? = null

  fun initialize(otherCatalystInstance: CatalystInstance?) {
    if (otherCatalystInstance == null) {
      throw IllegalArgumentException("CatalystInstance cannot be null.")
    }
    if (catalystInstance != null) {
      throw IllegalStateException("ReactContext has been already initialized")
    }
    if (destroyed) {
      ReactSoftExceptionLogger.logSoftException(
          TAG, IllegalStateException("Cannot initialize ReactContext after it has been destroyed."))
    }

    catalystInstance = otherCatalystInstance

    val queueConfig: ReactQueueConfiguration = otherCatalystInstance.reactQueueConfiguration
    initialize(queueConfig)
    initializeInteropModules()
  }

  override fun <T : JavaScriptModule?> getJSModule(jsInterface: Class<T>?): T? {
    val instance =
        catalystInstance
            ?: throw IllegalStateException(
                if (destroyed) LATE_JS_ACCESS_EXCEPTION_MESSAGE
                else EARLY_JS_ACCESS_EXCEPTION_MESSAGE)

    val interopModuleRegistry = mInteropModuleRegistry
    if (interopModuleRegistry != null &&
        interopModuleRegistry.shouldReturnInteropModule(jsInterface)) {
      return interopModuleRegistry.getInteropModule(jsInterface)
    }

    return instance.getJSModule(jsInterface)
  }

  override fun <T : NativeModule?> hasNativeModule(nativeModuleInterface: Class<T>?): Boolean {
    val instance =
        catalystInstance
            ?: throw IllegalStateException(
                if (destroyed) LATE_NATIVE_MODULE_EXCEPTION_MESSAGE
                else EARLY_NATIVE_MODULE_EXCEPTION_MESSAGE)
    return instance.hasNativeModule(nativeModuleInterface)
  }

  override fun getNativeModules(): MutableCollection<NativeModule> {
    val instance =
        catalystInstance
            ?: throw IllegalStateException(
                if (destroyed) LATE_NATIVE_MODULE_EXCEPTION_MESSAGE
                else EARLY_NATIVE_MODULE_EXCEPTION_MESSAGE)
    return instance.nativeModules
  }

  override fun <T : NativeModule?> getNativeModule(nativeModuleInterface: Class<T>?): T? {
    val instance =
        catalystInstance
            ?: throw IllegalStateException(
                if (destroyed) LATE_NATIVE_MODULE_EXCEPTION_MESSAGE
                else EARLY_NATIVE_MODULE_EXCEPTION_MESSAGE)
    return instance.getNativeModule(nativeModuleInterface)
  }

  @FrameworkAPI
  @UnstableReactNativeAPI
  override fun getRuntimeExecutor(): RuntimeExecutor? {
    val instance =
        catalystInstance
            ?: throw IllegalStateException(
                if (destroyed) LATE_RUNTIME_EXECUTOR_ACCESS_EXCEPTION_MESSAGE
                else EARLY_RUNTIME_EXECUTOR_ACCESS_EXCEPTION_MESSAGE)

    return instance.getRuntimeExecutor()
  }

  @Deprecated("This API is unsupported in the New Architecture.")
  override fun getCatalystInstance(): CatalystInstance {
    return Assertions.assertNotNull(catalystInstance)
  }

  @Deprecated(
      "This API is unsupported in the New Architecture.", ReplaceWith("hasActiveReactInstance()"))
  override fun hasActiveCatalystInstance(): Boolean {
    return hasActiveReactInstance()
  }

  override fun hasActiveReactInstance(): Boolean {
    val instance = catalystInstance
    return instance != null && !instance.isDestroyed
  }

  @Deprecated("This API is unsupported in the New Architecture.")
  override fun hasCatalystInstance(): Boolean {
    return catalystInstance != null
  }

  override fun destroy() {
    UiThreadUtil.assertOnUiThread()

    destroyed = true
    catalystInstance?.destroy()
  }

  override fun handleException(e: Exception?) {
    val jsExceptionHandler: JSExceptionHandler? = jsExceptionHandler

    if (hasActiveReactInstance() && jsExceptionHandler != null) {
      jsExceptionHandler.handleException(e)
    } else {
      FLog.e(
          ReactConstants.TAG,
          "Unable to handle Exception - catalystInstanceVariableExists: " +
              (catalystInstance != null) +
              " - isCatalystInstanceAlive: " +
              hasActiveReactInstance() +
              " - hasExceptionHandler: " +
              (jsExceptionHandler != null),
          e)
      throw IllegalStateException(e)
    }
  }

  override fun isBridgeless(): Boolean {
    return false
  }

  @Deprecated("This API is unsupported in the New Architecture.")
  override fun getJavaScriptContextHolder(): JavaScriptContextHolder? {
    return catalystInstance?.javaScriptContextHolder
  }

  override fun getFabricUIManager(): UIManager? {
    val instance =
        catalystInstance
            ?: throw IllegalStateException(
                if (destroyed) LATE_FABRIC_UI_MANAGER_ACCESS_EXCEPTION_MESSAGE
                else EARLY_FABRIC_UI_MANAGER_ACCESS_EXCEPTION_MESSAGE)

    return instance.fabricUIManager ?: instance.getJSIModule(JSIModuleType.UIManager) as? UIManager
  }

  override fun getSourceURL(): String? {
    return catalystInstance?.sourceURL
  }

  override fun registerSegment(segmentId: Int, path: String?, callback: Callback?) {
    Assertions.assertNotNull(catalystInstance).registerSegment(segmentId, path)
    Assertions.assertNotNull(callback).invoke()
  }

  companion object {
    private const val TAG = "BridgeReactContext"

    private const val EARLY_JS_ACCESS_EXCEPTION_MESSAGE =
        ("Tried to access a JS module before the React instance was fully set up. Calls to " +
            "ReactContext#getJSModule should only happen once initialize() has been called on your " +
            "native module.")
    private const val LATE_JS_ACCESS_EXCEPTION_MESSAGE =
        "Tried to access a JS module after the React instance was destroyed."
    private const val EARLY_NATIVE_MODULE_EXCEPTION_MESSAGE =
        "Trying to call native module before CatalystInstance has been set!"
    private const val LATE_NATIVE_MODULE_EXCEPTION_MESSAGE =
        "Trying to call native module after CatalystInstance has been destroyed!"

    private const val EARLY_RUNTIME_EXECUTOR_ACCESS_EXCEPTION_MESSAGE =
        "Tried to access a RuntimeExecutor before CatalystInstance has been set!"
    private const val LATE_RUNTIME_EXECUTOR_ACCESS_EXCEPTION_MESSAGE =
        "Tried to access a RuntimeExecutor after CatalystInstance has been destroyed!"

    private const val LATE_FABRIC_UI_MANAGER_ACCESS_EXCEPTION_MESSAGE =
        "Tried to access a FabricUIManager after CatalystInstance has been destroyed!"
    private const val EARLY_FABRIC_UI_MANAGER_ACCESS_EXCEPTION_MESSAGE =
        "Tried to access a FabricUIManager after CatalystInstance before it has been set!"
  }
}
