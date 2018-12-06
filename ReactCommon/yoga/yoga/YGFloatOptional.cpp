/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include "YGFloatOptional.h"
#include <cstdlib>
#include <iostream>
#include "Yoga-internal.h"
#include "Yoga.h"

using namespace facebook;

bool YGFloatOptional::operator==(YGFloatOptional op) const {
  return value_ == op.value_ || (isUndefined() && op.isUndefined());
}

bool YGFloatOptional::operator!=(YGFloatOptional op) const {
  return !(*this == op);
}

bool YGFloatOptional::operator==(float val) const {
  return value_ == val || (isUndefined() && yoga::isUndefined(val));
}

bool YGFloatOptional::operator!=(float val) const {
  return !(*this == val);
}

YGFloatOptional YGFloatOptional::operator-() const {
  return YGFloatOptional{-value_};
}

YGFloatOptional YGFloatOptional::operator+(YGFloatOptional op) const {
  return YGFloatOptional{value_ + op.value_};
}

YGFloatOptional YGFloatOptional::operator-(YGFloatOptional op) const {
  return YGFloatOptional{value_ - op.value_};
}

bool YGFloatOptional::operator>(YGFloatOptional op) const {
  return value_ > op.value_;
}

bool YGFloatOptional::operator<(YGFloatOptional op) const {
  return value_ < op.value_;
}

bool YGFloatOptional::operator>=(YGFloatOptional op) const {
  return *this > op || *this == op;
}

bool YGFloatOptional::operator<=(YGFloatOptional op) const {
  return *this < op || *this == op;
}
