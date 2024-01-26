/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<c5c87368aae4df966b4b7971aadb79f2>>
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

@DoNotStrip
interface ReactNativeFeatureFlagsProvider {
  @DoNotStrip fun commonTestFlag(): Boolean

  @DoNotStrip fun useModernRuntimeScheduler(): Boolean

  @DoNotStrip fun enableMicrotasks(): Boolean

  @DoNotStrip fun batchRenderingUpdatesInEventLoop(): Boolean
}
