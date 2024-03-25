/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/graphics/RectangleEdges.h>

namespace facebook::react {

/*
 * State for <SafeAreaView> component.
 */
class SafeAreaViewState final {
 public:
  EdgeInsets padding{};
};

} // namespace facebook::react
