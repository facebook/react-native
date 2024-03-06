/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<268a87860fea5f281567d2142f90b0d4>>
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

  @DoNotStrip public fun enableCustomDrawOrderFabric(): Boolean

  @DoNotStrip public fun enableFixForClippedSubviewsCrash(): Boolean

  @DoNotStrip public fun enableMicrotasks(): Boolean

  @DoNotStrip public fun enableMountHooksAndroid(): Boolean

  @DoNotStrip public fun enableSpannableBuildingUnification(): Boolean

  @DoNotStrip public fun inspectorEnableCxxInspectorPackagerConnection(): Boolean

  @DoNotStrip public fun inspectorEnableModernCDPRegistry(): Boolean

  @DoNotStrip public fun skipMountHookNotifications(): Boolean

  @DoNotStrip public fun useModernRuntimeScheduler(): Boolean
}
