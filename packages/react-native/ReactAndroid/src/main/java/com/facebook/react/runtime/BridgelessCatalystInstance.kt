/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// TODO T207169925: Migrate CatalystInstance to Reacthost and remove the Suppress("DEPRECATION")
// annotation
@file:Suppress("DEPRECATION")

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
import com.facebook.react.common.annotations.VisibleForTesting
import com.facebook.react.internal.turbomodule.core.interfaces.TurboModuleRegistry
import com.facebook.react.turbomodule.core.interfaces.CallInvokerHolder
import com.facebook.react.turbomodule.core.interfaces.NativeMethodCallInvokerHolder

@DoNotStrip
@Deprecated(
    message =
        "This class is deprecated, please to migrate to new architecture using [com.facebook.react.defaults.DefaultReactHost] instead.")
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

  public override val isDestroyed: Boolean
    get() = throw UnsupportedOperationException("Unimplemented method 'isDestroyed'")

  @VisibleForTesting
  override fun initialize() {
    throw UnsupportedOperationException("Unimplemented method 'initialize'")
  }

  override fun <T : JavaScriptModule> getJSModule(jsInterface: Class<T>): T? =
      reactHost.currentReactContext?.getJSModule(jsInterface)

  @get:Deprecated("Deprecated in Java")
  public override val javaScriptContextHolder: JavaScriptContextHolder
    get() = reactHost.getJavaScriptContextHolder()!!

  @Suppress("INAPPLICABLE_JVM_NAME")
  @get:Deprecated("Deprecated in Java")
  @get:JvmName("getJSCallInvokerHolder") // This is needed to keep backward compatibility
  public override val jsCallInvokerHolder: CallInvokerHolder
    get() = reactHost.getJSCallInvokerHolder()!!

  public override val nativeMethodCallInvokerHolder: NativeMethodCallInvokerHolder
    get() =
        throw UnsupportedOperationException(
            "Unimplemented method 'getNativeMethodCallInvokerHolder'")

  override fun <T : NativeModule> hasNativeModule(nativeModuleInterface: Class<T>): Boolean =
      reactHost.hasNativeModule(nativeModuleInterface)

  override fun <T : NativeModule> getNativeModule(nativeModuleInterface: Class<T>): T? =
      reactHost.getNativeModule(nativeModuleInterface)

  override fun getNativeModule(moduleName: String): NativeModule? =
      reactHost.getNativeModule(moduleName)

  public override val nativeModules: Collection<NativeModule>
    get() = reactHost.getNativeModules()

  public override val reactQueueConfiguration: ReactQueueConfiguration
    get() = reactHost.reactQueueConfiguration!!

  public override val runtimeExecutor: RuntimeExecutor?
    get() = reactHost.getRuntimeExecutor()

  public override val runtimeScheduler: RuntimeScheduler?
    get() = throw UnsupportedOperationException("Unimplemented method 'getRuntimeScheduler'")

  public override fun extendNativeModules(modules: NativeModuleRegistry) {
    throw UnsupportedOperationException("Unimplemented method 'extendNativeModules'")
  }

  public override val sourceURL: String?
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

  @Deprecated(
      message =
          "This class is deprecated, please to migrate to new architecture using [com.facebook.react.defaults.DefaultReactHost] instead.")
  override fun setTurboModuleRegistry(turboModuleRegistry: TurboModuleRegistry) {
    throw UnsupportedOperationException("Unimplemented method 'setTurboModuleRegistry'")
  }

  @Deprecated(
      message =
          "This class is deprecated, please to migrate to new architecture using [com.facebook.react.defaults.DefaultReactHost] instead.")
  override fun setFabricUIManager(fabricUIManager: UIManager) {
    throw UnsupportedOperationException("Unimplemented method 'setFabricUIManager'")
  }

  @Deprecated(
      message =
          "This class is deprecated, please to migrate to new architecture using [com.facebook.react.defaults.DefaultReactHost] instead.")
  override fun getFabricUIManager(): UIManager {
    throw UnsupportedOperationException("Unimplemented method 'getFabricUIManager'")
  }
}
