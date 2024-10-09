/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime

import android.content.res.AssetManager
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.bridge.CatalystInstance
import com.facebook.react.bridge.JavaScriptContextHolder
import com.facebook.react.bridge.JavaScriptModule
import com.facebook.react.bridge.NativeArray
import com.facebook.react.bridge.NativeArrayInterface
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.NativeModuleRegistry
import com.facebook.react.bridge.NotThreadSafeBridgeIdleDebugListener
import com.facebook.react.bridge.RuntimeExecutor
import com.facebook.react.bridge.RuntimeScheduler
import com.facebook.react.bridge.UIManager
import com.facebook.react.bridge.queue.ReactQueueConfiguration
import com.facebook.react.common.annotations.DeprecatedInNewArchitecture
import com.facebook.react.common.annotations.VisibleForTesting
import com.facebook.react.internal.turbomodule.core.interfaces.TurboModuleRegistry
import com.facebook.react.turbomodule.core.interfaces.CallInvokerHolder
import com.facebook.react.turbomodule.core.interfaces.NativeMethodCallInvokerHolder

@DoNotStrip
@DeprecatedInNewArchitecture
public class BridgelessCatalystInstance(private val reactHost: ReactHostImpl) : CatalystInstance {

  override fun handleMemoryPressure(level: Int) {
    throw UnsupportedOperationException("Unimplemented method 'handleMemoryPressure'")
  }

  override fun loadScriptFromAssets(
      assetManager: AssetManager,
      assetURL: String,
      loadSynchronously: Boolean
  ) {
    throw UnsupportedOperationException("Unimplemented method 'loadScriptFromAssets'")
  }

  override fun loadScriptFromFile(fileName: String, sourceURL: String, loadSynchronously: Boolean) {
    throw UnsupportedOperationException("Unimplemented method 'loadScriptFromFile'")
  }

  override fun loadSplitBundleFromFile(fileName: String, sourceURL: String) {
    throw UnsupportedOperationException("Unimplemented method 'loadSplitBundleFromFile'")
  }

  override fun setSourceURLs(deviceURL: String, remoteURL: String) {
    throw UnsupportedOperationException("Unimplemented method 'setSourceURLs'")
  }

  override fun runJSBundle() {
    throw UnsupportedOperationException("Unimplemented method 'runJSBundle'")
  }

  override fun hasRunJSBundle(): Boolean {
    throw UnsupportedOperationException("Unimplemented method 'hasRunJSBundle'")
  }

  @DoNotStrip
  override fun invokeCallback(callbackID: Int, arguments: NativeArrayInterface) {
    throw UnsupportedOperationException("Unimplemented method 'invokeCallback'")
  }

  override fun callFunction(module: String, method: String, arguments: NativeArray?) {
    throw UnsupportedOperationException("Unimplemented method 'callFunction'")
  }

  override fun destroy() {
    throw UnsupportedOperationException("Unimplemented method 'destroy'")
  }

  override public val isDestroyed: Boolean
    get() = throw UnsupportedOperationException("Unimplemented method 'isDestroyed'")

  @VisibleForTesting
  override fun initialize() {
    throw UnsupportedOperationException("Unimplemented method 'initialize'")
  }

  override fun <T : JavaScriptModule> getJSModule(jsInterface: Class<T>): T? =
      reactHost.currentReactContext?.getJSModule(jsInterface)

  override public val javaScriptContextHolder: JavaScriptContextHolder
    get() = reactHost.getJavaScriptContextHolder()!!

  @Suppress("INAPPLICABLE_JVM_NAME")
  @get:JvmName("getJSCallInvokerHolder") // This is needed to keep backward compatibility
  override public val jsCallInvokerHolder: CallInvokerHolder
    get() = reactHost.getJSCallInvokerHolder()!!

  override public val nativeMethodCallInvokerHolder: NativeMethodCallInvokerHolder
    get() =
        throw UnsupportedOperationException(
            "Unimplemented method 'getNativeMethodCallInvokerHolder'")

  override fun <T : NativeModule> hasNativeModule(nativeModuleInterface: Class<T>): Boolean =
      reactHost.hasNativeModule(nativeModuleInterface)

  override fun <T : NativeModule> getNativeModule(nativeModuleInterface: Class<T>): T? =
      reactHost.getNativeModule(nativeModuleInterface)

  override fun getNativeModule(moduleName: String): NativeModule? =
      reactHost.getNativeModule(moduleName)

  override public val nativeModules: Collection<NativeModule>
    get() = reactHost.getNativeModules()

  override public val reactQueueConfiguration: ReactQueueConfiguration
    get() = reactHost.reactQueueConfiguration!!

  override public val runtimeExecutor: RuntimeExecutor?
    get() = reactHost.getRuntimeExecutor()

  override public val runtimeScheduler: RuntimeScheduler?
    get() = throw UnsupportedOperationException("Unimplemented method 'getRuntimeScheduler'")

  override public fun extendNativeModules(modules: NativeModuleRegistry) {
    throw UnsupportedOperationException("Unimplemented method 'extendNativeModules'")
  }

  override public val sourceURL: String?
    get() = throw UnsupportedOperationException("Unimplemented method 'getSourceURL'")

  override fun addBridgeIdleDebugListener(listener: NotThreadSafeBridgeIdleDebugListener) {
    throw UnsupportedOperationException("Unimplemented method 'addBridgeIdleDebugListener'")
  }

  override fun removeBridgeIdleDebugListener(listener: NotThreadSafeBridgeIdleDebugListener) {
    throw UnsupportedOperationException("Unimplemented method 'removeBridgeIdleDebugListener'")
  }

  override fun registerSegment(segmentId: Int, path: String) {
    throw UnsupportedOperationException("Unimplemented method 'registerSegment'")
  }

  @VisibleForTesting
  override fun setGlobalVariable(propName: String, jsonValue: String) {
    throw UnsupportedOperationException("Unimplemented method 'setGlobalVariable'")
  }

  @DeprecatedInNewArchitecture(
      message =
          "This method will be deprecated later as part of Stable APIs with bridge removal and not encouraged usage.")
  override fun setTurboModuleRegistry(turboModuleRegistry: TurboModuleRegistry) {
    throw UnsupportedOperationException("Unimplemented method 'setTurboModuleRegistry'")
  }

  @DeprecatedInNewArchitecture(
      message =
          "This method will be deprecated later as part of Stable APIs with bridge removal and not encouraged usage.")
  override fun setFabricUIManager(fabricUIManager: UIManager) {
    throw UnsupportedOperationException("Unimplemented method 'setFabricUIManager'")
  }

  @DeprecatedInNewArchitecture(
      message =
          "This method will be deprecated later as part of Stable APIs with bridge removal and not encouraged usage.")
  override fun getFabricUIManager(): UIManager {
    throw UnsupportedOperationException("Unimplemented method 'getFabricUIManager'")
  }
}
