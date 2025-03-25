/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/enums/Edge.h>

namespace facebook::yoga {

enum class PhysicalEdge : uint32_t {
  Left = yoga::to_underlying(Edge::Left),
  Top = yoga::to_underlying(Edge::Top),
  Right = yoga::to_underlying(Edge::Right),
  Bottom = yoga::to_underlying(Edge::Bottom),
};

} // namespace facebook::yoga
