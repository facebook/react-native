/*
 *  Copyright (c) Facebook, Inc. and its affiliates.
 *
 *  This source code is licensed under the MIT license found in the LICENSE
 *  file in the root directory of this source tree.
 *
 */
#pragma once

struct YGFloatOptional {
 private:
  float value_;
  bool isUndefined_;

 public:
  explicit YGFloatOptional(float value);
  explicit YGFloatOptional() : value_(0), isUndefined_(true) {}

  // Program will terminate if the value of an undefined is accessed. Please
  // make sure to check if the optional is defined before calling this function.
  // To check if float optional is defined, use `isUndefined()`.
  float getValue() const;

  // Sets the value of float optional, and thus isUndefined is assigned false.
  void setValue(float val) {
    value_ = val;
    isUndefined_ = false;
  }

  bool isUndefined() const {
    return isUndefined_;
  }

  YGFloatOptional operator+(const YGFloatOptional& op);
  bool operator>(const YGFloatOptional& op) const;
  bool operator<(const YGFloatOptional& op) const;
  bool operator>=(const YGFloatOptional& op) const;
  bool operator<=(const YGFloatOptional& op) const;
  bool operator==(const YGFloatOptional& op) const;
  bool operator!=(const YGFloatOptional& op) const;

  bool operator==(float val) const;
  bool operator!=(float val) const;
};
