/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/graphics/Geometry.h>

namespace facebook {
namespace react {

/*
 * State for <SafeAreaView> component.
 */
class SafeAreaViewState final {
 public:
  using Shared = std::shared_ptr<const SafeAreaViewState>;

  SafeAreaViewState() = default;
  SafeAreaViewState(EdgeInsets padding_) : padding(padding_){};

  const EdgeInsets padding{};

#pragma mark - Getters
};

} // namespace react
} // namespace facebook
