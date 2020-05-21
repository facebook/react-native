/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/art/Element.h>
#include <react/graphics/Geometry.h>
#include <functional>
#include <memory>

namespace facebook {
namespace react {

/*
 * Simple, cross-platfrom, React-specific implementation of ART Shape Element
 */
class Shape : public Element {
 public:
  using Shared = std::shared_ptr<const Shape>;
  Shape(
      Float opacity,
      std::vector<Float> transform,
      std::vector<Float> d,
      std::vector<Float> stroke,
      std::vector<Float> strokeDash,
      std::vector<Float> fill,
      Float strokeWidth,
      int strokeCap,
      int strokeJoin)
      : Element(2, opacity, transform),
        d(d),
        stroke(stroke),
        strokeDash(strokeDash),
        fill(fill),
        strokeWidth(strokeWidth),
        strokeCap(strokeCap),
        strokeJoin(strokeJoin){};
  Shape() = default;
  virtual ~Shape(){};

  std::vector<Float> d{};
  std::vector<Float> stroke{};
  std::vector<Float> strokeDash{};
  std::vector<Float> fill{};
  Float strokeWidth{1.0};
  int strokeCap{1};
  int strokeJoin{1};

#ifdef ANDROID
  folly::dynamic getDynamic() const override;
#endif
};

} // namespace react
} // namespace facebook
