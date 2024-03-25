/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.popupmenu

import com.facebook.react.BaseReactPackage
import com.facebook.react.ViewManagerOnDemandReactPackage
import com.facebook.react.bridge.ModuleSpec
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModuleList
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager

@ReactModuleList(nativeModules = arrayOf())
class PopupMenuPackage() : BaseReactPackage(), ViewManagerOnDemandReactPackage {
  private var viewManagersMap: Map<String, ModuleSpec>? = null

  override fun getModule(name: String, context: ReactApplicationContext): NativeModule? {
    return null
  }

  private fun getViewManagersMap(): Map<String, ModuleSpec> {
    val viewManagers =
        viewManagersMap
            ?: mapOf(
                ReactPopupMenuManager.REACT_CLASS to
                    ModuleSpec.viewManagerSpec({ ReactPopupMenuManager() }))
    viewManagersMap = viewManagers
    return viewManagers
  }

  protected override fun getViewManagers(context: ReactApplicationContext): List<ModuleSpec> {
    return ArrayList(getViewManagersMap().values)
  }

  override fun getViewManagerNames(context: ReactApplicationContext): Collection<String> {
    return getViewManagersMap().keys
  }

  override fun createViewManager(
      reactContext: ReactApplicationContext,
      viewManagerName: String
  ): ViewManager<*, *>? {
    val spec: ModuleSpec? = getViewManagersMap().get(viewManagerName)
    return if (spec != null) (spec.getProvider().get() as ViewManager<*, *>) else null
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    return ReactModuleInfoProvider { emptyMap() }
  }
}
