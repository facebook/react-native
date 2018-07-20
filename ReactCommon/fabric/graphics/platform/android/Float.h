// Copyright (c) 2004-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#pragma once

#include <limits>

namespace facebook {
namespace react {

/*
 * Exact type of float numbers which ideally should match a type behing
 * platform- and chip-architecture-specific float type.
 */
using Float = float;

/*
 * Large positive number signifies that the `Float` values is `undefined`.
 */
const Float kFloatUndefined = std::numeric_limits<Float>::max();

const Float kFloatMax = std::numeric_limits<Float>::max();
const Float kFloatMin = std::numeric_limits<Float>::min();

} // namespace react
} // namespace facebook
