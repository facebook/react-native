/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.bridge

import android.content.Context
import com.facebook.common.logging.FLog
import com.facebook.infer.annotation.Assertions
import com.facebook.infer.annotation.ThreadConfined
import com.facebook.infer.annotation.ThreadConfined.UI
import com.facebook.react.common.ReactConstants
import com.facebook.react.common.annotations.VisibleForTesting
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger
import com.facebook.react.turbomodule.core.interfaces.CallInvokerHolder
import kotlin.checkNotNull

/**
 * This is the bridge-specific concrete subclass of ReactContext. ReactContext has many methods that
 * delegate to the react instance. This subclass implements those methods, by delegating to the
 * CatalystInstance. If you need to create a ReactContext within an "bridge context", please create
 * BridgeReactContext.
 *
 * @deprecated This class is deprecated in the New Architecture and will be replaced by
 *   [com.facebook.react.runtime.BridgelessReactContext]
 */
@VisibleForTesting
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
@Deprecated(
    message = "This class is part of Legacy Architecture and will be removed in a future release"
)
public class BridgeReactContext(context: Context) : ReactApplicationContext(context) {

  public interface RCTDeviceEventEmitter : JavaScriptModule {
    public fun emit(eventName: String, data: Any?)
  }

  @Volatile private var destroyed = false
  private var catalystInstance: CatalystInstance? = null

  init {
    LegacyArchitectureLogger.assertLegacyArchitecture(
        "BridgeReactContext",
        LegacyArchitectureLogLevel.ERROR,
    )
  }

  /** Set and initialize CatalystInstance for this Context. This should be called exactly once. */
  public fun initializeWithInstance(catalystInstance: CatalystInstance?) {
    requireNotNull(catalystInstance) { "CatalystInstance cannot be null." }

    if (this.catalystInstance != null) {
      throw IllegalStateException("ReactContext has been already initialized")
    }

    if (destroyed) {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          IllegalStateException("Cannot initialize ReactContext after it has been destroyed."),
      )
    }

    this.catalystInstance = catalystInstance

    val queueConfig = catalystInstance.reactQueueConfiguration
    initializeMessageQueueThreads(queueConfig)
    initializeInteropModules()
  }

  private fun raiseCatalystInstanceMissingException(): Nothing {
    val message =
        if (destroyed) {
          LATE_NATIVE_MODULE_EXCEPTION_MESSAGE
        } else {
          EARLY_NATIVE_MODULE_EXCEPTION_MESSAGE
        }
    throw IllegalStateException(message)
  }

  /**
   * @return handle to the specified JS module for the CatalystInstance associated with this Context
   */
  override fun <T : JavaScriptModule> getJSModule(jsInterface: Class<T>): T? {
    val catalystInstance = this.catalystInstance
    if (catalystInstance == null) {
      val message =
          if (destroyed) {
            LATE_JS_ACCESS_EXCEPTION_MESSAGE
          } else {
            EARLY_JS_ACCESS_EXCEPTION_MESSAGE
          }
      throw IllegalStateException(message)
    }

    mInteropModuleRegistry?.let { registry ->
      registry.getInteropModule(jsInterface)?.let { jsModule ->
        return jsModule
      }
    }

    return catalystInstance.getJSModule(jsInterface)
  }

  override public fun <T : NativeModule> hasNativeModule(nativeModuleInterface: Class<T>): Boolean {
    val catalystInstance = this.catalystInstance ?: raiseCatalystInstanceMissingException()
    return catalystInstance.hasNativeModule(nativeModuleInterface)
  }

  override public fun getNativeModules(): Collection<NativeModule> {
    val catalystInstance = this.catalystInstance ?: raiseCatalystInstanceMissingException()
    return catalystInstance.nativeModules
  }

  /** @return the instance of the specified module interface associated with this ReactContext. */
  override fun <T : NativeModule> getNativeModule(nativeModuleInterface: Class<T>): T? {
    val catalystInstance = this.catalystInstance ?: raiseCatalystInstanceMissingException()
    return catalystInstance.getNativeModule(nativeModuleInterface)
  }

  override fun getNativeModule(moduleName: String): NativeModule? {
    val catalystInstance = this.catalystInstance ?: raiseCatalystInstanceMissingException()
    return catalystInstance.getNativeModule(moduleName)
  }

  override fun getCatalystInstance(): CatalystInstance = Assertions.assertNotNull(catalystInstance)

  /**
   * This API has been deprecated due to naming consideration, please use hasActiveReactInstance()
   * instead
   */
  @Deprecated("Use hasActiveReactInstance() instead")
  override fun hasActiveCatalystInstance(): Boolean = hasActiveReactInstance()

  /** @return true if there is an non-null, alive react native instance */
  override fun hasActiveReactInstance(): Boolean = catalystInstance?.isDestroyed ?: false

  /**
   * This API has been deprecated due to naming consideration, please use hasReactInstance() instead
   */
  @Deprecated("Use hasReactInstance() instead")
  override fun hasCatalystInstance(): Boolean = catalystInstance != null

  override fun hasReactInstance(): Boolean = catalystInstance != null

  /** Destroy this instance, making it unusable. */
  @ThreadConfined(UI)
  override fun destroy() {
    UiThreadUtil.assertOnUiThread()

    destroyed = true
    catalystInstance?.destroy()
  }

  /**
   * Passes the given exception to the current JSExceptionHandler if one exists, rethrowing
   * otherwise.
   */
  override fun handleException(e: Exception) {
    val catalystInstance = this.catalystInstance
    val catalystInstanceVariableExists = catalystInstance != null
    val isCatalystInstanceAlive = catalystInstance != null && !catalystInstance.isDestroyed
    val hasExceptionHandler = jsExceptionHandler != null

    if (isCatalystInstanceAlive && hasExceptionHandler) {
      jsExceptionHandler?.handleException(e)
    } else {
      FLog.e(
          ReactConstants.TAG,
          "Unable to handle Exception - catalystInstanceVariableExists: " +
              "$catalystInstanceVariableExists" +
              " - isCatalystInstanceAlive: " +
              "$isCatalystInstanceAlive" +
              " - hasExceptionHandler: " +
              "$hasExceptionHandler",
          e,
      )
      throw IllegalStateException(e)
    }
  }

  /** @deprecated DO NOT USE, this method will be removed in the near future. */
  @Deprecated("DO NOT USE, this method will be removed in the near future.")
  override fun isBridgeless(): Boolean = false

  /**
   * Get the C pointer (as a long) to the JavaScriptCore context associated with this instance. Use
   * the following pattern to ensure that the JS context is not cleared while you are using it:
   * JavaScriptContextHolder jsContext = reactContext.getJavaScriptContextHolder()
   * synchronized(jsContext) { nativeThingNeedingJsContext(jsContext.get()); }
   */
  override fun getJavaScriptContextHolder(): JavaScriptContextHolder? =
      catalystInstance?.javaScriptContextHolder

  /**
   * Returns a hybrid object that contains a pointer to a JS CallInvoker, which is used to schedule
   * work on the JS Thread.
   */
  override fun getJSCallInvokerHolder(): CallInvokerHolder? = catalystInstance?.jsCallInvokerHolder

  /**
   * Get the UIManager for Fabric from the CatalystInstance.
   *
   * @return The UIManager when CatalystInstance is active.
   * @deprecated Do not use this method. Instead use [com.facebook.react.uimanager.UIManagerHelper]
   *   method getUIManager to get the UIManager instance from the current ReactContext.
   */
  @Deprecated("Use UIManagerHelper.getUIManager() instead")
  override fun getFabricUIManager(): UIManager? {
    @Suppress("DEPRECATION")
    return catalystInstance?.getFabricUIManager()
  }

  /**
   * Get the sourceURL for the JS bundle from the CatalystInstance. This method is needed for
   * compatibility with bridgeless mode, which has no CatalystInstance.
   *
   * @return The JS bundle URL set when the bundle was loaded
   */
  override fun getSourceURL(): String? = catalystInstance?.sourceURL

  /**
   * Register a JS segment after loading it from cache or server, make sure catalystInstance is
   * properly initialised and not null before calling.
   */
  override fun registerSegment(segmentId: Int, path: String, callback: Callback) {
    checkNotNull(catalystInstance).registerSegment(segmentId, path)
    checkNotNull(callback).invoke()
  }

  public companion object {
    private const val TAG = "BridgeReactContext"

    private const val EARLY_JS_ACCESS_EXCEPTION_MESSAGE =
        "Tried to access a JS module before the React instance was fully set up. Calls to " +
            "ReactContext#getJSModule should only happen once initialize() has been called on your " +
            "native module."

    private const val LATE_JS_ACCESS_EXCEPTION_MESSAGE =
        "Tried to access a JS module after the React instance was destroyed."

    private const val EARLY_NATIVE_MODULE_EXCEPTION_MESSAGE =
        "Trying to call native module before CatalystInstance has been set!"

    private const val LATE_NATIVE_MODULE_EXCEPTION_MESSAGE =
        "Trying to call native module after CatalystInstance has been destroyed!"
  }
}
