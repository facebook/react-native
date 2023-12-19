/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/Yoga.h>

#include <yoga/numeric/FloatOptional.h>
#include <yoga/style/Style.h>

namespace facebook::yoga {

inline FloatOptional resolveValue(Style::Length length, float ownerSize) {
  switch (length.unit()) {
    case Unit::Point:
      return length.value();
    case Unit::Percent:
      return FloatOptional{length.value().unwrap() * ownerSize * 0.01f};
    default:
      return FloatOptional{};
  }
}

} // namespace facebook::yoga
