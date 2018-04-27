/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <fabric/graphics/Color.h>
#include <fabric/graphics/Geometry.h>

namespace facebook {
namespace react {

#pragma mark - Color

SharedColor colorFromDynamic(const folly::dynamic &value);
std::string colorNameFromColor(const SharedColor &value);

#pragma mark - Geometry

std::string stringFromPoint(const Point &point);
std::string stringFromSize(const Size &size);
std::string stringFromRect(const Rect &rect);
std::string stringFromEdgeInsets(const EdgeInsets &edgeInsets);

Float floatFromDynamic(const folly::dynamic &value);
Point pointFromDynamic(const folly::dynamic &value);
Size sizeFromDynamic(const folly::dynamic &value);

} // namespace react
} // namespace facebook
