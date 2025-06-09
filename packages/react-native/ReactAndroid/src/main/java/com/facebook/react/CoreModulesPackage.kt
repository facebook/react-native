/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants
import com.facebook.react.common.ClassFinder
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger
import com.facebook.react.devsupport.LogBoxModule
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.module.annotations.ReactModuleList
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.modules.core.ExceptionsManagerModule
import com.facebook.react.modules.core.HeadlessJsTaskSupportModule
import com.facebook.react.modules.core.TimingModule
import com.facebook.react.modules.debug.DevMenuModule
import com.facebook.react.modules.debug.DevSettingsModule
import com.facebook.react.modules.debug.SourceCodeModule
import com.facebook.react.modules.deviceinfo.DeviceInfoModule
import com.facebook.react.modules.systeminfo.AndroidInfoModule
import com.facebook.react.uimanager.UIManagerModule
import com.facebook.react.uimanager.ViewManager
import com.facebook.react.uimanager.ViewManagerResolver
import com.facebook.systrace.Systrace

/**
 * This is the basic module to support React Native. The debug modules are now in DebugCorePackage.
 */
@ReactModuleList(
    // WARNING: If you modify this list, ensure that the list below in method
    // getReactModuleInfoByInitialization is also updated
    nativeModules =
        [
            AndroidInfoModule::class,
            DeviceEventManagerModule::class,
            DeviceInfoModule::class,
            DevMenuModule::class,
            DevSettingsModule::class,
            ExceptionsManagerModule::class,
            LogBoxModule::class,
            HeadlessJsTaskSupportModule::class,
            SourceCodeModule::class,
            TimingModule::class,
            UIManagerModule::class])
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
internal class CoreModulesPackage(
    private val reactInstanceManager: ReactInstanceManager,
    private val hardwareBackBtnHandler: DefaultHardwareBackBtnHandler,
    private val lazyViewManagersEnabled: Boolean,
    private val minTimeLeftInFrameForNonBatchedOperationMs: Int
) : BaseReactPackage(), ReactPackageLogger {
  /**
   * This method is overridden, since OSS does not run the annotation processor to generate
   * [CoreModulesPackage.ReactModuleInfoProvider] class. Here we check if it exists with the method
   * [canLoadClassesFromAnnotationProcessors]. If it does not exist, we generate one manually in
   * [CoreModulesPackage.getReactModuleInfoByInitialization] and return that instead.
   */
  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    if (!ClassFinder.canLoadClassesFromAnnotationProcessors()) {
      return fallbackForMissingClass()
    }

    try {
      val reactModuleInfoProviderClass =
          ClassFinder.findClass("com.facebook.react.CoreModulesPackage\$\$ReactModuleInfoProvider")
      return reactModuleInfoProviderClass?.getDeclaredConstructor()?.newInstance()
          as ReactModuleInfoProvider
    } catch (e: ClassNotFoundException) {
      return fallbackForMissingClass()
    } catch (e: InstantiationException) {
      throw RuntimeException(
          "No ReactModuleInfoProvider for CoreModulesPackage$\$ReactModuleInfoProvider", e)
    } catch (e: IllegalAccessException) {
      throw RuntimeException(
          "No ReactModuleInfoProvider for CoreModulesPackage$\$ReactModuleInfoProvider", e)
    }
  }

  private fun fallbackForMissingClass(): ReactModuleInfoProvider {
    // In OSS case, the annotation processor does not run. We fall back on creating this byhand
    val moduleList: Array<Class<out NativeModule>> =
        arrayOf(
            AndroidInfoModule::class.java,
            DeviceEventManagerModule::class.java,
            DeviceInfoModule::class.java,
            DevMenuModule::class.java,
            DevSettingsModule::class.java,
            ExceptionsManagerModule::class.java,
            LogBoxModule::class.java,
            HeadlessJsTaskSupportModule::class.java,
            SourceCodeModule::class.java,
            TimingModule::class.java,
            UIManagerModule::class.java,
        )

    val reactModuleInfoMap: MutableMap<String, ReactModuleInfo> = HashMap<String, ReactModuleInfo>()
    for (moduleClass in moduleList) {
      val reactModule: ReactModule? =
          moduleClass.getAnnotation<ReactModule>(ReactModule::class.java)

      if (reactModule != null) {
        reactModuleInfoMap[reactModule.name] =
            ReactModuleInfo(
                reactModule.name,
                moduleClass.name,
                reactModule.canOverrideExistingModule,
                reactModule.needsEagerInit,
                reactModule.isCxxModule,
                ReactModuleInfo.classIsTurboModule(moduleClass))
      }
    }

    return ReactModuleInfoProvider { reactModuleInfoMap }
  }

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    return when (name) {
      AndroidInfoModule.NAME -> AndroidInfoModule(reactContext)
      DeviceEventManagerModule.NAME ->
          DeviceEventManagerModule(reactContext, hardwareBackBtnHandler)
      DevMenuModule.NAME -> DevMenuModule(reactContext, reactInstanceManager.devSupportManager)
      DevSettingsModule.NAME ->
          DevSettingsModule(reactContext, reactInstanceManager.devSupportManager)
      ExceptionsManagerModule.NAME ->
          ExceptionsManagerModule(reactInstanceManager.devSupportManager)
      LogBoxModule.NAME -> LogBoxModule(reactContext, reactInstanceManager.devSupportManager)
      HeadlessJsTaskSupportModule.NAME -> HeadlessJsTaskSupportModule(reactContext)
      SourceCodeModule.NAME -> SourceCodeModule(reactContext)
      TimingModule.NAME -> TimingModule(reactContext, reactInstanceManager.devSupportManager)
      UIManagerModule.NAME -> createUIManager(reactContext)
      DeviceInfoModule.NAME -> DeviceInfoModule(reactContext)
      else ->
          throw IllegalArgumentException(
              "In CoreModulesPackage, could not find Native module for $name")
    }
  }

  private fun createUIManager(reactContext: ReactApplicationContext): UIManagerModule {
    ReactMarker.logMarker(ReactMarkerConstants.CREATE_UI_MANAGER_MODULE_START)
    Systrace.beginSection(Systrace.TRACE_TAG_REACT, "createUIManagerModule")

    try {
      if (lazyViewManagersEnabled) {
        val resolver: ViewManagerResolver =
            object : ViewManagerResolver {
              override fun getViewManager(viewManagerName: String): ViewManager<*, *>? {
                return reactInstanceManager.createViewManager(viewManagerName)
              }

              override fun getViewManagerNames(): Collection<String> {
                return reactInstanceManager.viewManagerNames
              }
            }

        return UIManagerModule(reactContext, resolver, minTimeLeftInFrameForNonBatchedOperationMs)
      } else {
        return UIManagerModule(
            reactContext,
            reactInstanceManager.getOrCreateViewManagers(reactContext),
            minTimeLeftInFrameForNonBatchedOperationMs)
      }
    } finally {
      Systrace.endSection(Systrace.TRACE_TAG_REACT)
      ReactMarker.logMarker(ReactMarkerConstants.CREATE_UI_MANAGER_MODULE_END)
    }
  }

  override fun startProcessPackage() {
    ReactMarker.logMarker(ReactMarkerConstants.PROCESS_CORE_REACT_PACKAGE_START)
  }

  override fun endProcessPackage() {
    ReactMarker.logMarker(ReactMarkerConstants.PROCESS_CORE_REACT_PACKAGE_END)
  }

  private companion object {
    init {
      LegacyArchitectureLogger.assertLegacyArchitecture(
          "CoreModulesPackage", LegacyArchitectureLogLevel.ERROR)
    }
  }
}
