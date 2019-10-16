/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/legacyviewmanagerinterop/LegacyViewManagerInteropState.h>
#include <react/components/legacyviewmanagerinterop/LegacyViewManagerInteropViewEventEmitter.h>
#include <react/components/legacyviewmanagerinterop/LegacyViewManagerInteropViewProps.h>
#include <react/components/view/ConcreteViewShadowNode.h>

namespace facebook {
namespace react {

extern const char LegacyViewManagerInteropComponentName[];

using LegacyViewManagerInteropShadowNode = ConcreteViewShadowNode<
    LegacyViewManagerInteropComponentName,
    LegacyViewManagerInteropViewProps,
    LegacyViewManagerInteropViewEventEmitter,
    LegacyViewManagerInteropState>;

} // namespace react
} // namespace facebook
