/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/legacyviewmanagerinterop/LegacyViewManagerInteropViewProps.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>

namespace facebook::react {

extern const char LegacyViewManagerAndroidInteropComponentName[];

using LegacyViewManagerAndroidInteropShadowNode =
    ConcreteViewShadowNode<LegacyViewManagerAndroidInteropComponentName, LegacyViewManagerInteropViewProps>;

} // namespace facebook::react
