/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<d23f1c4cd3f8960397455c495ed240ba>>
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

public class ReactNativeFeatureFlagsCxxAccessor : ReactNativeFeatureFlagsAccessor {
  private var commonTestFlagCache: Boolean? = null
  private var batchRenderingUpdatesInEventLoopCache: Boolean? = null
  private var destroyFabricSurfacesInReactInstanceManagerCache: Boolean? = null
  private var enableBackgroundExecutorCache: Boolean? = null
  private var enableCleanTextInputYogaNodeCache: Boolean? = null
  private var enableCustomDrawOrderFabricCache: Boolean? = null
  private var enableMicrotasksCache: Boolean? = null
  private var enableSpannableBuildingUnificationCache: Boolean? = null
  private var enableSynchronousStateUpdatesCache: Boolean? = null
  private var enableUIConsistencyCache: Boolean? = null
  private var forceBatchingMountItemsOnAndroidCache: Boolean? = null
  private var inspectorEnableCxxInspectorPackagerConnectionCache: Boolean? = null
  private var inspectorEnableModernCDPRegistryCache: Boolean? = null
  private var preventDoubleTextMeasureCache: Boolean? = null
  private var useModernRuntimeSchedulerCache: Boolean? = null
  private var useNativeViewConfigsInBridgelessModeCache: Boolean? = null
  private var useStateAlignmentMechanismCache: Boolean? = null

  override fun commonTestFlag(): Boolean {
    var cached = commonTestFlagCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.commonTestFlag()
      commonTestFlagCache = cached
    }
    return cached
  }

  override fun batchRenderingUpdatesInEventLoop(): Boolean {
    var cached = batchRenderingUpdatesInEventLoopCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.batchRenderingUpdatesInEventLoop()
      batchRenderingUpdatesInEventLoopCache = cached
    }
    return cached
  }

  override fun destroyFabricSurfacesInReactInstanceManager(): Boolean {
    var cached = destroyFabricSurfacesInReactInstanceManagerCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.destroyFabricSurfacesInReactInstanceManager()
      destroyFabricSurfacesInReactInstanceManagerCache = cached
    }
    return cached
  }

  override fun enableBackgroundExecutor(): Boolean {
    var cached = enableBackgroundExecutorCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableBackgroundExecutor()
      enableBackgroundExecutorCache = cached
    }
    return cached
  }

  override fun enableCleanTextInputYogaNode(): Boolean {
    var cached = enableCleanTextInputYogaNodeCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableCleanTextInputYogaNode()
      enableCleanTextInputYogaNodeCache = cached
    }
    return cached
  }

  override fun enableCustomDrawOrderFabric(): Boolean {
    var cached = enableCustomDrawOrderFabricCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableCustomDrawOrderFabric()
      enableCustomDrawOrderFabricCache = cached
    }
    return cached
  }

  override fun enableMicrotasks(): Boolean {
    var cached = enableMicrotasksCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableMicrotasks()
      enableMicrotasksCache = cached
    }
    return cached
  }

  override fun enableSpannableBuildingUnification(): Boolean {
    var cached = enableSpannableBuildingUnificationCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableSpannableBuildingUnification()
      enableSpannableBuildingUnificationCache = cached
    }
    return cached
  }

  override fun enableSynchronousStateUpdates(): Boolean {
    var cached = enableSynchronousStateUpdatesCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableSynchronousStateUpdates()
      enableSynchronousStateUpdatesCache = cached
    }
    return cached
  }

  override fun enableUIConsistency(): Boolean {
    var cached = enableUIConsistencyCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.enableUIConsistency()
      enableUIConsistencyCache = cached
    }
    return cached
  }

  override fun forceBatchingMountItemsOnAndroid(): Boolean {
    var cached = forceBatchingMountItemsOnAndroidCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.forceBatchingMountItemsOnAndroid()
      forceBatchingMountItemsOnAndroidCache = cached
    }
    return cached
  }

  override fun inspectorEnableCxxInspectorPackagerConnection(): Boolean {
    var cached = inspectorEnableCxxInspectorPackagerConnectionCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.inspectorEnableCxxInspectorPackagerConnection()
      inspectorEnableCxxInspectorPackagerConnectionCache = cached
    }
    return cached
  }

  override fun inspectorEnableModernCDPRegistry(): Boolean {
    var cached = inspectorEnableModernCDPRegistryCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.inspectorEnableModernCDPRegistry()
      inspectorEnableModernCDPRegistryCache = cached
    }
    return cached
  }

  override fun preventDoubleTextMeasure(): Boolean {
    var cached = preventDoubleTextMeasureCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.preventDoubleTextMeasure()
      preventDoubleTextMeasureCache = cached
    }
    return cached
  }

  override fun useModernRuntimeScheduler(): Boolean {
    var cached = useModernRuntimeSchedulerCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.useModernRuntimeScheduler()
      useModernRuntimeSchedulerCache = cached
    }
    return cached
  }

  override fun useNativeViewConfigsInBridgelessMode(): Boolean {
    var cached = useNativeViewConfigsInBridgelessModeCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.useNativeViewConfigsInBridgelessMode()
      useNativeViewConfigsInBridgelessModeCache = cached
    }
    return cached
  }

  override fun useStateAlignmentMechanism(): Boolean {
    var cached = useStateAlignmentMechanismCache
    if (cached == null) {
      cached = ReactNativeFeatureFlagsCxxInterop.useStateAlignmentMechanism()
      useStateAlignmentMechanismCache = cached
    }
    return cached
  }

  override fun override(provider: ReactNativeFeatureFlagsProvider): Unit =
      ReactNativeFeatureFlagsCxxInterop.override(provider as Any)

  override fun dangerouslyReset(): Unit = ReactNativeFeatureFlagsCxxInterop.dangerouslyReset()
}
