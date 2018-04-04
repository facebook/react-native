/**
 * Copyright (c) 2014-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

struct YGFloatOptional {
 private:
  float value_;
  bool isUndefined_;

 public:
  explicit YGFloatOptional(const float& value);
  explicit YGFloatOptional();

  // Program will terminate if the value of an undefined is accessed. Please
  // make sure to check if the optional is defined before calling this function.
  // To check if float optional is defined, use `isUndefined()`.
  const float& getValue() const;

  // Sets the value of float optional, and thus isUndefined is assigned false.
  void setValue(const float& val);

  const bool& isUndefined() const;

  YGFloatOptional operator+(const YGFloatOptional& op);
  bool operator>(const YGFloatOptional& op) const;
  bool operator<(const YGFloatOptional& op) const;
  bool operator>=(const YGFloatOptional& op) const;
  bool operator<=(const YGFloatOptional& op) const;
  bool operator==(const YGFloatOptional& op) const;
  bool operator!=(const YGFloatOptional& op) const;

  bool operator==(const float& val) const;
  bool operator!=(const float& val) const;
};
