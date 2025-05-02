/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
package com.facebook.react

import com.facebook.react.bridge.ModuleHolder
import com.facebook.react.bridge.ModuleSpec
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager
import com.facebook.systrace.Systrace.TRACE_TAG_REACT
import com.facebook.systrace.SystraceMessage

/** React package supporting lazy creation of native modules. */
@Deprecated("This class is deprecated, please use BaseReactPackage instead.")
@LegacyArchitecture
public abstract class LazyReactPackage public constructor() : ReactPackage {
    /**
     * We return an iterable
     *
     * @param reactContext context
     * @return [<] that contains all native modules registered for the context
     */
    public fun getNativeModuleIterator(
        reactContext: ReactApplicationContext?
    ): Iterable<ModuleHolder> {
        val reactModuleInfoMap: Map<String, ReactModuleInfo> =
            reactModuleInfoProvider.getReactModuleInfos()
        val nativeModules = getNativeModules(reactContext)

        return object : Iterable<ModuleHolder> {
            override fun iterator(): Iterator<ModuleHolder> {
                var position = 0

                return object : Iterator<ModuleHolder> {
                    override fun hasNext(): Boolean {
                        return position < nativeModules.size
                    }

                    override fun next(): ModuleHolder {
                        val moduleSpec = nativeModules[position++]
                        val name = moduleSpec.name

                        return reactModuleInfoMap[name].let moduleHolder@{ reactModuleInfo ->
                            if (reactModuleInfo == null) {
                                val module: NativeModule
                                ReactMarker.logMarker(
                                    ReactMarkerConstants.CREATE_MODULE_START,
                                    name,
                                )
                                try {
                                    module = moduleSpec.provider.get()
                                } finally {
                                    ReactMarker.logMarker(ReactMarkerConstants.CREATE_MODULE_END)
                                }
                                return@moduleHolder ModuleHolder(module)
                            } else {
                                return@moduleHolder ModuleHolder(
                                    reactModuleInfo,
                                    moduleSpec.provider,
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * @param reactContext react application context that can be used to create modules
     * @return list of module specs that can create the native modules
     */
    public abstract fun getNativeModules(reactContext: ReactApplicationContext?): List<ModuleSpec>

    /**
     * @param reactContext react application context that can be used to create modules
     * @return [<] to register
     */
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        val modules: MutableList<NativeModule> = ArrayList()
        for (holder in getNativeModules(reactContext)) {
            var nativeModule: NativeModule
            SystraceMessage.beginSection(TRACE_TAG_REACT, "createNativeModule").flush()
            ReactMarker.logMarker(ReactMarkerConstants.CREATE_MODULE_START, holder.name)
            try {
                nativeModule = holder.provider.get()
            } finally {
                ReactMarker.logMarker(ReactMarkerConstants.CREATE_MODULE_END)
                SystraceMessage.endSection(TRACE_TAG_REACT).flush()
            }
            modules.add(nativeModule)
        }
        return modules
    }

    /**
     * @param reactContext react application context that can be used to create View Managers.
     * @return list of module specs that can create the View Managers.
     */
    public fun getViewManagers(reactContext: ReactApplicationContext?): List<ModuleSpec> {
        return emptyList()
    }

    override fun createViewManagers(
        reactContext: ReactApplicationContext
    ): List<ViewManager<*, *>> {
        val viewManagerModuleSpecs = getViewManagers(reactContext)
        if (viewManagerModuleSpecs.isNullOrEmpty()) {
            return emptyList()
        }

        val viewManagers: MutableList<ViewManager<*, *>> = ArrayList()
        for (moduleSpec in viewManagerModuleSpecs) {
            viewManagers.add(moduleSpec.provider.get() as ViewManager<*, *>)
        }
        return viewManagers
    }

    public abstract val reactModuleInfoProvider: ReactModuleInfoProvider

    public companion object {
        init {
            LegacyArchitectureLogger.assertLegacyArchitecture(
                "LazyReactPackage",
                LegacyArchitectureLogLevel.WARNING,
            )
        }
    }
}
