/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<9638eb154fe6e488aebcf20c462f498e>>
 */

/**
 * IMPORTANT: Do NOT modify this file directly.
 *
 * To change the definition of the flags, edit
 *   packages/react-native/scripts/featureflags/ReactNativeFeatureFlags.json.
 *
 * To regenerate this code, run the following script from the repo root:
 *   yarn featureflags-update
 */

package com.facebook.react.internal.featureflags

import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.soloader.SoLoader

@DoNotStrip
object ReactNativeFeatureFlagsCxxInterop {
  init {
    SoLoader.loadLibrary("react_featureflagsjni")
  }

  @DoNotStrip @JvmStatic external fun commonTestFlag(): Boolean

  @DoNotStrip @JvmStatic external fun useModernRuntimeScheduler(): Boolean

  @DoNotStrip @JvmStatic external fun enableMicrotasks(): Boolean

  @DoNotStrip @JvmStatic external fun batchRenderingUpdatesInEventLoop(): Boolean

  @DoNotStrip @JvmStatic external fun enableSpannableBuildingUnification(): Boolean

  @DoNotStrip @JvmStatic external fun enableCustomDrawOrderFabric(): Boolean

  @DoNotStrip @JvmStatic external fun override(provider: Any)

  @DoNotStrip @JvmStatic external fun dangerouslyReset()
}
