/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/graphics/Color.h>

#include <string>

namespace facebook {
namespace react {

struct PickerItemsStruct {
  std::string label;
  std::string value;
  SharedColor textColor;

  bool operator==(const PickerItemsStruct &rhs) const {
    return (
        label == rhs.label && value == rhs.value && textColor == rhs.textColor);
  }
};

} // namespace react
} // namespace facebook
