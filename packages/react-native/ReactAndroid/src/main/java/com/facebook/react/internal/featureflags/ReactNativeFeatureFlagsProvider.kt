/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<51dd25e88ebf2ac9929c477e710d3d8d>>
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

import com.facebook.proguard.annotations.DoNotStrip

@DoNotStrip
public interface ReactNativeFeatureFlagsProvider {
  @DoNotStrip public fun commonTestFlag(): Boolean

  @DoNotStrip public fun batchRenderingUpdatesInEventLoop(): Boolean

  @DoNotStrip public fun enableBackgroundExecutor(): Boolean

  @DoNotStrip public fun enableCleanTextInputYogaNode(): Boolean

  @DoNotStrip public fun enableCustomDrawOrderFabric(): Boolean

  @DoNotStrip public fun enableFixForClippedSubviewsCrash(): Boolean

  @DoNotStrip public fun enableMicrotasks(): Boolean

  @DoNotStrip public fun enableMountHooksAndroid(): Boolean

  @DoNotStrip public fun enableSpannableBuildingUnification(): Boolean

  @DoNotStrip public fun enableSynchronousStateUpdates(): Boolean

  @DoNotStrip public fun enableUIConsistency(): Boolean

  @DoNotStrip public fun inspectorEnableCxxInspectorPackagerConnection(): Boolean

  @DoNotStrip public fun inspectorEnableModernCDPRegistry(): Boolean

  @DoNotStrip public fun useModernRuntimeScheduler(): Boolean

  @DoNotStrip public fun useNativeViewConfigsInBridgelessMode(): Boolean
}
