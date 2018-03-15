/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "YGFloatOptional.h"
#include <cstdlib>
#include <iostream>

YGFloatOptional::YGFloatOptional(const float& value)
    : value_(value), isUndefined_(false) {}
YGFloatOptional::YGFloatOptional() : value_(0), isUndefined_(true) {}

float YGFloatOptional::getValue() const {
  if (isUndefined_) {
    // Abort, accessing a value of an undefined float optional
    std::cerr << "Tried to get value of an undefined YGFloatOptional\n";
    std::exit(EXIT_FAILURE);
  }
  return value_;
}

void YGFloatOptional::setValue(const float& val) {
  value_ = val;
  isUndefined_ = false;
}

bool YGFloatOptional::isUndefined() const {
  return isUndefined_;
}
