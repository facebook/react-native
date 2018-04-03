/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "YGFloatOptional.h"
#include <cstdlib>
#include <iostream>
#include "Yoga.h"

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

bool YGFloatOptional::operator==(const YGFloatOptional& op) const {
  if (isUndefined_ == op.isUndefined()) {
    return isUndefined_ ? true : value_ == op.getValue();
  }
  return false;
}

bool YGFloatOptional::operator!=(const YGFloatOptional& op) const {
  return !(*this == op);
}

bool YGFloatOptional::operator==(const float& val) const {
  if (YGFloatIsUndefined(val) == isUndefined_) {
    return isUndefined_ ? true : val == value_;
  }
  return false;
}

bool YGFloatOptional::operator!=(const float& val) const {
  return !(*this == val);
}
