/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/legacyviewmanagerinterop/LegacyViewManagerInteropState.h>
#include <react/renderer/components/legacyviewmanagerinterop/LegacyViewManagerInteropViewProps.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>

namespace facebook::react {

extern const char LegacyViewManagerInteropComponentName[];

using LegacyViewManagerInteropShadowNode = ConcreteViewShadowNode<
    LegacyViewManagerInteropComponentName,
    LegacyViewManagerInteropViewProps,
    ViewEventEmitter,
    LegacyViewManagerInteropState>;

} // namespace facebook::react
