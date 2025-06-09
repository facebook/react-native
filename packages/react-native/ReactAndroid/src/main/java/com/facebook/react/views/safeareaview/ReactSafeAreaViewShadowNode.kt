/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.safeareaview

import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.uimanager.LayoutShadowNode

@Deprecated(
    message = "ReactSafeAreaViewShadowNode is deprecated and will be removed in a future release. " +
              "Use react-native-safe-area-context instead.",
    level = DeprecationLevel.WARNING
)
@LegacyArchitecture
internal class ReactSafeAreaViewShadowNode : LayoutShadowNode()
