/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/view/ViewProps.h>
#include <react/renderer/core/ShadowNodeTraits.h>

namespace facebook::react::ViewTraitsInitializer {

static bool formsStackingContext(ViewProps const &props) {
  return false;
}

static bool formsView(ViewProps const &props) {
  return false;
}

static ShadowNodeTraits::Trait extraTraits() {
  return ShadowNodeTraits::Trait::None;
}

} // namespace facebook::react::ViewTraitsInitializer
