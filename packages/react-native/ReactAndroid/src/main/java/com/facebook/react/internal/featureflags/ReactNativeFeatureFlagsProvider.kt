/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @generated SignedSource<<82eaefcdbe1f6d10a8f23515a1d4da4f>>
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

  @DoNotStrip fun inspectorEnableCXXInspectorPackagerConnection(): Boolean

  @DoNotStrip fun inspectorEnableModernCDPRegistry(): Boolean
}
