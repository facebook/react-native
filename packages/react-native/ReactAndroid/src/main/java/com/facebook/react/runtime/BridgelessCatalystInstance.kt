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
import com.facebook.react.bridge.JSIModule
import com.facebook.react.bridge.JSIModuleSpec
import com.facebook.react.bridge.JSIModuleType
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

  override fun getSourceURL(): String? {
    throw UnsupportedOperationException("Unimplemented method 'getSourceURL'")
  }

  @DoNotStrip
  override fun invokeCallback(callbackID: Int, arguments: NativeArrayInterface) {
    throw UnsupportedOperationException("Unimplemented method 'invokeCallback'")
  }

  override fun callFunction(module: String, method: String, arguments: NativeArray) {
    throw UnsupportedOperationException("Unimplemented method 'callFunction'")
  }

  override fun destroy() {
    throw UnsupportedOperationException("Unimplemented method 'destroy'")
  }

  override fun isDestroyed(): Boolean {
    throw UnsupportedOperationException("Unimplemented method 'isDestroyed'")
  }

  @VisibleForTesting
  override fun initialize() {
    throw UnsupportedOperationException("Unimplemented method 'initialize'")
  }

  override fun getReactQueueConfiguration(): ReactQueueConfiguration {
    throw UnsupportedOperationException("Unimplemented method 'getReactQueueConfiguration'")
  }

  override fun <T : JavaScriptModule> getJSModule(jsInterface: Class<T>): T {
    throw UnsupportedOperationException("Unimplemented method 'getJSModule'")
  }

  override fun <T : NativeModule> hasNativeModule(nativeModuleInterface: Class<T>): Boolean {
    throw UnsupportedOperationException("Unimplemented method 'hasNativeModule'")
  }

  override fun <T : NativeModule> getNativeModule(nativeModuleInterface: Class<T>): T? {
    throw UnsupportedOperationException("Unimplemented method 'getNativeModule'")
  }

  override fun getNativeModule(moduleName: String): NativeModule? {
    throw UnsupportedOperationException("Unimplemented method 'getNativeModule'")
  }

  @Deprecated(
      message =
          "getJSIModule(JSIModuleType moduleType) is deprecated and will be deleted in the future. Please use ReactInstanceEventListener to subscribe for react instance events instead.")
  override fun getJSIModule(moduleType: JSIModuleType): JSIModule {
    throw UnsupportedOperationException("Unimplemented method 'getJSIModule'")
  }

  override fun getNativeModules(): Collection<NativeModule> {
    throw UnsupportedOperationException("Unimplemented method 'getNativeModules'")
  }

  override fun extendNativeModules(modules: NativeModuleRegistry) {
    throw UnsupportedOperationException("Unimplemented method 'extendNativeModules'")
  }

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

  @Deprecated(message = "This API is unsupported in the New Architecture.")
  override fun getJavaScriptContextHolder(): JavaScriptContextHolder? {
    return reactHost.getJavaScriptContextHolder()
  }

  override fun getRuntimeExecutor(): RuntimeExecutor? {
    return reactHost.getRuntimeExecutor()
  }

  override fun getRuntimeScheduler(): RuntimeScheduler {
    throw UnsupportedOperationException("Unimplemented method 'getRuntimeScheduler'")
  }

  @Deprecated(message = "This API is unsupported in the New Architecture.")
  override fun <T : JSIModule> addJSIModules(jsiModules: List<JSIModuleSpec<T>>) {
    throw UnsupportedOperationException("Unimplemented method 'addJSIModules'")
  }

  override fun getJSCallInvokerHolder(): CallInvokerHolder? {
    return reactHost.getJSCallInvokerHolder()
  }

  override fun getNativeMethodCallInvokerHolder(): NativeMethodCallInvokerHolder {
    throw UnsupportedOperationException("Unimplemented method 'getNativeMethodCallInvokerHolder'")
  }

  @Deprecated(
      message =
          "setTurboModuleManager(JSIModule getter) is deprecated and will be deleted in the future. Please use setTurboModuleRegistry(TurboModuleRegistry turboModuleRegistry) instead.",
      replaceWith = ReplaceWith("setTurboModuleRegistry(turboModuleRegistry)"))
  override fun setTurboModuleManager(getter: JSIModule) {
    throw UnsupportedOperationException("Unimplemented method 'setTurboModuleManager'")
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
