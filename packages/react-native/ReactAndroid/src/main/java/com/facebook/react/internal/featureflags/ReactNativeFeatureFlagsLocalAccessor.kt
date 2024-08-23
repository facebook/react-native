/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<d23d2a5f44f2b2068dde9e85e5b1ce9f>>
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
  private var allowCollapsableChildrenCache: Boolean? = null
  private var allowRecursiveCommitsWithSynchronousMountOnAndroidCache: Boolean? = null
  private var batchRenderingUpdatesInEventLoopCache: Boolean? = null
  private var destroyFabricSurfacesInReactInstanceManagerCache: Boolean? = null
  private var enableBackgroundExecutorCache: Boolean? = null
  private var enableCleanTextInputYogaNodeCache: Boolean? = null
  private var enableGranularShadowTreeStateReconciliationCache: Boolean? = null
  private var enableMicrotasksCache: Boolean? = null
  private var enableSynchronousStateUpdatesCache: Boolean? = null
  private var enableUIConsistencyCache: Boolean? = null
  private var fixStoppedSurfaceRemoveDeleteTreeUIFrameCallbackLeakCache: Boolean? = null
  private var forceBatchingMountItemsOnAndroidCache: Boolean? = null
  private var fuseboxEnabledDebugCache: Boolean? = null
  private var fuseboxEnabledReleaseCache: Boolean? = null
  private var lazyAnimationCallbacksCache: Boolean? = null
  private var preventDoubleTextMeasureCache: Boolean? = null
  private var setAndroidLayoutDirectionCache: Boolean? = null
  private var useImmediateExecutorInAndroidBridgelessCache: Boolean? = null
  private var useModernRuntimeSchedulerCache: Boolean? = null
  private var useNativeViewConfigsInBridgelessModeCache: Boolean? = null
  private var useRuntimeShadowNodeReferenceUpdateCache: Boolean? = null
  private var useRuntimeShadowNodeReferenceUpdateOnLayoutCache: Boolean? = null
  private var useStateAlignmentMechanismCache: Boolean? = null

  override fun commonTestFlag(): Boolean {
    var cached = commonTestFlagCache
    if (cached == null) {
      cached = currentProvider.commonTestFlag()
      accessedFeatureFlags.add("commonTestFlag")
      commonTestFlagCache = cached
    }
    return cached
  }

  override fun allowCollapsableChildren(): Boolean {
    var cached = allowCollapsableChildrenCache
    if (cached == null) {
      cached = currentProvider.allowCollapsableChildren()
      accessedFeatureFlags.add("allowCollapsableChildren")
      allowCollapsableChildrenCache = cached
    }
    return cached
  }

  override fun allowRecursiveCommitsWithSynchronousMountOnAndroid(): Boolean {
    var cached = allowRecursiveCommitsWithSynchronousMountOnAndroidCache
    if (cached == null) {
      cached = currentProvider.allowRecursiveCommitsWithSynchronousMountOnAndroid()
      accessedFeatureFlags.add("allowRecursiveCommitsWithSynchronousMountOnAndroid")
      allowRecursiveCommitsWithSynchronousMountOnAndroidCache = cached
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

  override fun destroyFabricSurfacesInReactInstanceManager(): Boolean {
    var cached = destroyFabricSurfacesInReactInstanceManagerCache
    if (cached == null) {
      cached = currentProvider.destroyFabricSurfacesInReactInstanceManager()
      accessedFeatureFlags.add("destroyFabricSurfacesInReactInstanceManager")
      destroyFabricSurfacesInReactInstanceManagerCache = cached
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

  override fun enableCleanTextInputYogaNode(): Boolean {
    var cached = enableCleanTextInputYogaNodeCache
    if (cached == null) {
      cached = currentProvider.enableCleanTextInputYogaNode()
      accessedFeatureFlags.add("enableCleanTextInputYogaNode")
      enableCleanTextInputYogaNodeCache = cached
    }
    return cached
  }

  override fun enableGranularShadowTreeStateReconciliation(): Boolean {
    var cached = enableGranularShadowTreeStateReconciliationCache
    if (cached == null) {
      cached = currentProvider.enableGranularShadowTreeStateReconciliation()
      accessedFeatureFlags.add("enableGranularShadowTreeStateReconciliation")
      enableGranularShadowTreeStateReconciliationCache = cached
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

  override fun enableSynchronousStateUpdates(): Boolean {
    var cached = enableSynchronousStateUpdatesCache
    if (cached == null) {
      cached = currentProvider.enableSynchronousStateUpdates()
      accessedFeatureFlags.add("enableSynchronousStateUpdates")
      enableSynchronousStateUpdatesCache = cached
    }
    return cached
  }

  override fun enableUIConsistency(): Boolean {
    var cached = enableUIConsistencyCache
    if (cached == null) {
      cached = currentProvider.enableUIConsistency()
      accessedFeatureFlags.add("enableUIConsistency")
      enableUIConsistencyCache = cached
    }
    return cached
  }

  override fun fixStoppedSurfaceRemoveDeleteTreeUIFrameCallbackLeak(): Boolean {
    var cached = fixStoppedSurfaceRemoveDeleteTreeUIFrameCallbackLeakCache
    if (cached == null) {
      cached = currentProvider.fixStoppedSurfaceRemoveDeleteTreeUIFrameCallbackLeak()
      accessedFeatureFlags.add("fixStoppedSurfaceRemoveDeleteTreeUIFrameCallbackLeak")
      fixStoppedSurfaceRemoveDeleteTreeUIFrameCallbackLeakCache = cached
    }
    return cached
  }

  override fun forceBatchingMountItemsOnAndroid(): Boolean {
    var cached = forceBatchingMountItemsOnAndroidCache
    if (cached == null) {
      cached = currentProvider.forceBatchingMountItemsOnAndroid()
      accessedFeatureFlags.add("forceBatchingMountItemsOnAndroid")
      forceBatchingMountItemsOnAndroidCache = cached
    }
    return cached
  }

  override fun fuseboxEnabledDebug(): Boolean {
    var cached = fuseboxEnabledDebugCache
    if (cached == null) {
      cached = currentProvider.fuseboxEnabledDebug()
      accessedFeatureFlags.add("fuseboxEnabledDebug")
      fuseboxEnabledDebugCache = cached
    }
    return cached
  }

  override fun fuseboxEnabledRelease(): Boolean {
    var cached = fuseboxEnabledReleaseCache
    if (cached == null) {
      cached = currentProvider.fuseboxEnabledRelease()
      accessedFeatureFlags.add("fuseboxEnabledRelease")
      fuseboxEnabledReleaseCache = cached
    }
    return cached
  }

  override fun lazyAnimationCallbacks(): Boolean {
    var cached = lazyAnimationCallbacksCache
    if (cached == null) {
      cached = currentProvider.lazyAnimationCallbacks()
      accessedFeatureFlags.add("lazyAnimationCallbacks")
      lazyAnimationCallbacksCache = cached
    }
    return cached
  }

  override fun preventDoubleTextMeasure(): Boolean {
    var cached = preventDoubleTextMeasureCache
    if (cached == null) {
      cached = currentProvider.preventDoubleTextMeasure()
      accessedFeatureFlags.add("preventDoubleTextMeasure")
      preventDoubleTextMeasureCache = cached
    }
    return cached
  }

  override fun setAndroidLayoutDirection(): Boolean {
    var cached = setAndroidLayoutDirectionCache
    if (cached == null) {
      cached = currentProvider.setAndroidLayoutDirection()
      accessedFeatureFlags.add("setAndroidLayoutDirection")
      setAndroidLayoutDirectionCache = cached
    }
    return cached
  }

  override fun useImmediateExecutorInAndroidBridgeless(): Boolean {
    var cached = useImmediateExecutorInAndroidBridgelessCache
    if (cached == null) {
      cached = currentProvider.useImmediateExecutorInAndroidBridgeless()
      accessedFeatureFlags.add("useImmediateExecutorInAndroidBridgeless")
      useImmediateExecutorInAndroidBridgelessCache = cached
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

  override fun useNativeViewConfigsInBridgelessMode(): Boolean {
    var cached = useNativeViewConfigsInBridgelessModeCache
    if (cached == null) {
      cached = currentProvider.useNativeViewConfigsInBridgelessMode()
      accessedFeatureFlags.add("useNativeViewConfigsInBridgelessMode")
      useNativeViewConfigsInBridgelessModeCache = cached
    }
    return cached
  }

  override fun useRuntimeShadowNodeReferenceUpdate(): Boolean {
    var cached = useRuntimeShadowNodeReferenceUpdateCache
    if (cached == null) {
      cached = currentProvider.useRuntimeShadowNodeReferenceUpdate()
      accessedFeatureFlags.add("useRuntimeShadowNodeReferenceUpdate")
      useRuntimeShadowNodeReferenceUpdateCache = cached
    }
    return cached
  }

  override fun useRuntimeShadowNodeReferenceUpdateOnLayout(): Boolean {
    var cached = useRuntimeShadowNodeReferenceUpdateOnLayoutCache
    if (cached == null) {
      cached = currentProvider.useRuntimeShadowNodeReferenceUpdateOnLayout()
      accessedFeatureFlags.add("useRuntimeShadowNodeReferenceUpdateOnLayout")
      useRuntimeShadowNodeReferenceUpdateOnLayoutCache = cached
    }
    return cached
  }

  override fun useStateAlignmentMechanism(): Boolean {
    var cached = useStateAlignmentMechanismCache
    if (cached == null) {
      cached = currentProvider.useStateAlignmentMechanism()
      accessedFeatureFlags.add("useStateAlignmentMechanism")
      useStateAlignmentMechanismCache = cached
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
