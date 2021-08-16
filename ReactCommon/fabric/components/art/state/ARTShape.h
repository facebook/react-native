/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/components/art/ARTElement.h>
#include <react/components/art/primitives.h>
#include <react/graphics/Geometry.h>
#include <functional>
#include <memory>

namespace facebook {
namespace react {

/*
 * Simple, cross-platfrom, React-specific implementation of ART Shape Element
 */
class ARTShape : public ARTElement {
 public:
  using Shared = std::shared_ptr<const ARTShape>;
  ARTShape(
      Float opacity,
      std::vector<Float> transform,
      std::vector<Float> d,
      std::vector<Float> stroke,
      std::vector<Float> strokeDash,
      std::vector<Float> fill,
      Float strokeWidth,
      int strokeCap,
      int strokeJoin)
      : ARTElement(ARTElementType::Shape, opacity, transform),
        d(d),
        stroke(stroke),
        strokeDash(strokeDash),
        fill(fill),
        strokeWidth(strokeWidth),
        strokeCap(strokeCap),
        strokeJoin(strokeJoin){};
  ARTShape() = default;
  virtual ~ARTShape(){};

  std::vector<Float> d{};
  std::vector<Float> stroke{};
  std::vector<Float> strokeDash{};
  std::vector<Float> fill{};
  Float strokeWidth{1.0};
  int strokeCap{1};
  int strokeJoin{1};

  bool operator==(const ARTElement &rhs) const override;
  bool operator!=(const ARTElement &rhs) const override;

#ifdef ANDROID
  folly::dynamic getDynamic() const override;
#endif
};

} // namespace react
} // namespace facebook
