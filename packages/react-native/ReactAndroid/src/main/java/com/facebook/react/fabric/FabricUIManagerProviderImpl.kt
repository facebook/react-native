/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UIManager
import com.facebook.react.bridge.UIManagerProvider
import com.facebook.react.fabric.events.EventBeatManager
import com.facebook.react.uimanager.ViewManagerRegistry
import com.facebook.systrace.Systrace

public class FabricUIManagerProviderImpl(
    private val componentFactory: ComponentFactory,
    private val config: ReactNativeConfig,
    private val viewManagerRegistry: ViewManagerRegistry
) : UIManagerProvider {

  public override fun createUIManager(reactApplicationContext: ReactApplicationContext): UIManager {
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "FabricUIManagerProviderImpl.create")
    val eventBeatManager = EventBeatManager()
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "FabricUIManagerProviderImpl.createUIManager")

    val fabricUIManager =
        FabricUIManager(reactApplicationContext, viewManagerRegistry, eventBeatManager)

    Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE)

    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "FabricUIManagerProviderImpl.registerBinding")
    val binding = BindingImpl()

    val catalystInstance = reactApplicationContext.catalystInstance

    binding.register(
        catalystInstance.runtimeExecutor,
        catalystInstance.runtimeScheduler,
        fabricUIManager,
        eventBeatManager,
        componentFactory,
        config)

    Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE)
    Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE)

    return fabricUIManager
  }
}
