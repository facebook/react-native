/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<3ec82b003df6f3743305f6161c301360>>
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
interface ReactNativeFeatureFlagsProvider {
  @DoNotStrip fun commonTestFlag(): Boolean

  @DoNotStrip fun enableBackgroundExecutor(): Boolean

  @DoNotStrip fun useModernRuntimeScheduler(): Boolean

  @DoNotStrip fun enableMicrotasks(): Boolean

  @DoNotStrip fun batchRenderingUpdatesInEventLoop(): Boolean

  @DoNotStrip fun enableSpannableBuildingUnification(): Boolean

  @DoNotStrip fun enableCustomDrawOrderFabric(): Boolean

  @DoNotStrip fun enableFixForClippedSubviewsCrash(): Boolean
}
