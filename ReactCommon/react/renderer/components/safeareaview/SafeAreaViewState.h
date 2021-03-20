/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/graphics/Geometry.h>

namespace facebook {
namespace react {

/*
 * State for <SafeAreaView> component.
 */
class SafeAreaViewState final {
 public:
  EdgeInsets padding{};
};

} // namespace react
} // namespace facebook
