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

/**
 * Implementation of the UIManagerProvider for Fabric renderer on bridge mode
 *
 * @param [componentFactory] The factory for creating components.
 * @param [viewManagerRegistry] The registry of view managers.
 */
public class FabricUIManagerProviderImpl(
    private val componentFactory: ComponentFactory,
    private val viewManagerRegistry: ViewManagerRegistry
) : UIManagerProvider {

  /**
   * Creates a UIManager instance for the provided ReactApplicationContext.
   *
   * This method initializes tracing sections for performance monitoring, creates a FabricUIManager
   * using the supplied ReactApplicationContext and ViewManagerRegistry, manages event beats, and
   * registers FabricUIManagerBinding with the runtime environment of the provided
   * ReactApplicationContext.
   *
   * @param context The React application context.
   * @return A newly created FabricUIManager instance.
   * @throws IllegalStateException If runtimeExecutor or runtimeScheduler is null.
   */
  override fun createUIManager(context: ReactApplicationContext): UIManager {
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "FabricUIManagerProviderImpl.create")
    val eventBeatManager = EventBeatManager()
    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "FabricUIManagerProviderImpl.createUIManager")

    val fabricUIManager = FabricUIManager(context, viewManagerRegistry, eventBeatManager)
    Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE)

    Systrace.beginSection(
        Systrace.TRACE_TAG_REACT_JAVA_BRIDGE, "FabricUIManagerProviderImpl.registerBinding")
    val binding = FabricUIManagerBinding()

    val catalystInstance = context.catalystInstance

    val runtimeExecutor = catalystInstance?.runtimeExecutor
    val runtimeScheduler = catalystInstance?.runtimeScheduler

    if (runtimeExecutor != null && runtimeScheduler != null) {
      binding.register(
          runtimeExecutor, runtimeScheduler, fabricUIManager, eventBeatManager, componentFactory)
    } else {
      throw IllegalStateException(
          "Unable to register FabricUIManager with CatalystInstance, runtimeExecutor and" +
              " runtimeScheduler must not be null")
    }

    Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE)
    Systrace.endSection(Systrace.TRACE_TAG_REACT_JAVA_BRIDGE)

    return fabricUIManager
  }
}
