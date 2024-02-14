/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<63356ad414e641eae11ca07b1a876fd3>>
 */

/**
 * IMPORTANT: Do NOT modify this file directly.
 *
 * To change the definition of the flags, edit
 *   packages/react-native/scripts/featureflags/ReactNativeFeatureFlags.config.js.
 *
 * To regenerate this code, run the following script from the repo root:
 *   yarn featureflags-update
 */

package com.facebook.react.internal.featureflags

public class ReactNativeFeatureFlagsLocalAccessor : ReactNativeFeatureFlagsAccessor {
  private var currentProvider: ReactNativeFeatureFlagsProvider = ReactNativeFeatureFlagsDefaults()

  private val accessedFeatureFlags = mutableSetOf<String>()

  private var commonTestFlagCache: Boolean? = null
  private var enableBackgroundExecutorCache: Boolean? = null
  private var useModernRuntimeSchedulerCache: Boolean? = null
  private var enableMicrotasksCache: Boolean? = null
  private var batchRenderingUpdatesInEventLoopCache: Boolean? = null
  private var enableSpannableBuildingUnificationCache: Boolean? = null
  private var enableCustomDrawOrderFabricCache: Boolean? = null
  private var enableFixForClippedSubviewsCrashCache: Boolean? = null
  private var inspectorEnableCxxInspectorPackagerConnectionCache: Boolean? = null
  private var inspectorEnableModernCDPRegistryCache: Boolean? = null

  override fun commonTestFlag(): Boolean {
    var cached = commonTestFlagCache
    if (cached == null) {
      cached = currentProvider.commonTestFlag()
      accessedFeatureFlags.add("commonTestFlag")
      commonTestFlagCache = cached
    }
    return cached
  }

  override fun enableBackgroundExecutor(): Boolean {
    var cached = enableBackgroundExecutorCache
    if (cached == null) {
      cached = currentProvider.enableBackgroundExecutor()
      accessedFeatureFlags.add("enableBackgroundExecutor")
      enableBackgroundExecutorCache = cached
    }
    return cached
  }

  override fun useModernRuntimeScheduler(): Boolean {
    var cached = useModernRuntimeSchedulerCache
    if (cached == null) {
      cached = currentProvider.useModernRuntimeScheduler()
      accessedFeatureFlags.add("useModernRuntimeScheduler")
      useModernRuntimeSchedulerCache = cached
    }
    return cached
  }

  override fun enableMicrotasks(): Boolean {
    var cached = enableMicrotasksCache
    if (cached == null) {
      cached = currentProvider.enableMicrotasks()
      accessedFeatureFlags.add("enableMicrotasks")
      enableMicrotasksCache = cached
    }
    return cached
  }

  override fun batchRenderingUpdatesInEventLoop(): Boolean {
    var cached = batchRenderingUpdatesInEventLoopCache
    if (cached == null) {
      cached = currentProvider.batchRenderingUpdatesInEventLoop()
      accessedFeatureFlags.add("batchRenderingUpdatesInEventLoop")
      batchRenderingUpdatesInEventLoopCache = cached
    }
    return cached
  }

  override fun enableSpannableBuildingUnification(): Boolean {
    var cached = enableSpannableBuildingUnificationCache
    if (cached == null) {
      cached = currentProvider.enableSpannableBuildingUnification()
      accessedFeatureFlags.add("enableSpannableBuildingUnification")
      enableSpannableBuildingUnificationCache = cached
    }
    return cached
  }

  override fun enableCustomDrawOrderFabric(): Boolean {
    var cached = enableCustomDrawOrderFabricCache
    if (cached == null) {
      cached = currentProvider.enableCustomDrawOrderFabric()
      accessedFeatureFlags.add("enableCustomDrawOrderFabric")
      enableCustomDrawOrderFabricCache = cached
    }
    return cached
  }

  override fun enableFixForClippedSubviewsCrash(): Boolean {
    var cached = enableFixForClippedSubviewsCrashCache
    if (cached == null) {
      cached = currentProvider.enableFixForClippedSubviewsCrash()
      accessedFeatureFlags.add("enableFixForClippedSubviewsCrash")
      enableFixForClippedSubviewsCrashCache = cached
    }
    return cached
  }

  override fun inspectorEnableCxxInspectorPackagerConnection(): Boolean {
    var cached = inspectorEnableCxxInspectorPackagerConnectionCache
    if (cached == null) {
      cached = currentProvider.inspectorEnableCxxInspectorPackagerConnection()
      accessedFeatureFlags.add("inspectorEnableCxxInspectorPackagerConnection")
      inspectorEnableCxxInspectorPackagerConnectionCache = cached
    }
    return cached
  }

  override fun inspectorEnableModernCDPRegistry(): Boolean {
    var cached = inspectorEnableModernCDPRegistryCache
    if (cached == null) {
      cached = currentProvider.inspectorEnableModernCDPRegistry()
      accessedFeatureFlags.add("inspectorEnableModernCDPRegistry")
      inspectorEnableModernCDPRegistryCache = cached
    }
    return cached
  }

  override fun override(provider: ReactNativeFeatureFlagsProvider) {
    if (accessedFeatureFlags.isNotEmpty()) {
      val accessedFeatureFlagsStr = accessedFeatureFlags.joinToString(separator = ", ") { it }
      throw IllegalStateException(
          "Feature flags were accessed before being overridden: $accessedFeatureFlagsStr")
    }
    currentProvider = provider
  }

  override fun dangerouslyReset() {
    // We don't need to do anything here because `ReactNativeFeatureFlags` will
    // just create a new instance of this class.
  }
}
