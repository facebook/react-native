/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/graphics/Float.h>
#include <react/graphics/Geometry.h>
#include <react/graphics/conversions.h>

namespace facebook {
namespace react {

/*
 * State for <InputAccessoryView> component.
 */
class InputAccessoryState final {
 public:
  InputAccessoryState(){};
  InputAccessoryState(Size screenSize_) : screenSize(screenSize_){};

  const Size screenSize{};
};

} // namespace react
} // namespace facebook
