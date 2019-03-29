/*
 *  Copyright (c) Facebook, Inc. and its affiliates.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#include "YGFloatOptional.h"
#include <cstdlib>
#include <iostream>
#include "Yoga.h"
#include "Yoga-internal.h"

using namespace facebook;

YGFloatOptional::YGFloatOptional(float value) {
  if (yoga::isUndefined(value)) {
    isUndefined_ = true;
    value_ = 0;
  } else {
    value_ = value;
    isUndefined_ = false;
  }
}

float YGFloatOptional::getValue() const {
  if (isUndefined_) {
    // Abort, accessing a value of an undefined float optional
    std::cerr << "Tried to get value of an undefined YGFloatOptional\n";
    std::exit(EXIT_FAILURE);
  }
  return value_;
}

bool YGFloatOptional::operator==(const YGFloatOptional& op) const {
  if (isUndefined_ == op.isUndefined()) {
    return isUndefined_ || value_ == op.getValue();
  }
  return false;
}

bool YGFloatOptional::operator!=(const YGFloatOptional& op) const {
  return !(*this == op);
}

bool YGFloatOptional::operator==(float val) const {
  if (yoga::isUndefined(val) == isUndefined_) {
    return isUndefined_ || val == value_;
  }
  return false;
}

bool YGFloatOptional::operator!=(float val) const {
  return !(*this == val);
}

YGFloatOptional YGFloatOptional::operator+(const YGFloatOptional& op) {
  if (!isUndefined_ && !op.isUndefined_) {
    return YGFloatOptional(value_ + op.value_);
  }
  return YGFloatOptional();
}

bool YGFloatOptional::operator>(const YGFloatOptional& op) const {
  if (isUndefined_ || op.isUndefined_) {
    return false;
  }
  return value_ > op.value_;
}

bool YGFloatOptional::operator<(const YGFloatOptional& op) const {
  if (isUndefined_ || op.isUndefined_) {
    return false;
  }
  return value_ < op.value_;
}

bool YGFloatOptional::operator>=(const YGFloatOptional& op) const {
  return *this == op || *this > op;
}

bool YGFloatOptional::operator<=(const YGFloatOptional& op) const {
  return *this == op || *this < op;
}
